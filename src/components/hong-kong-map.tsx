"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feature, FeatureCollection, MultiLineString, Point } from "geojson";
import {
  Circle,
  CircleMarker,
  FeatureGroup,
  GeoJSON,
  LayersControl,
  MapContainer,
  TileLayer,
  Tooltip,
  ZoomControl,
} from "react-leaflet";
import {
  mtrDataSource,
  type MtrMapFeatureCollection,
  type MtrRouteProperties,
  type MtrStationValidation,
  type MtrStationProperties,
} from "@/data/mtr-reference";

const hongKongCenter: [number, number] = [22.3193, 114.1694];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

function isMtrMapData(value: unknown): value is MtrMapFeatureCollection {
  if (!isRecord(value) || value.type !== "FeatureCollection") return false;
  if (
    !Array.isArray(value.features) ||
    typeof value.extractedAt !== "string" ||
    typeof value.license !== "string" ||
    typeof value.attribution !== "string" ||
    !isRecord(value.supplementalStationExtraction) ||
    (value.supplementalStationExtraction.timestamp !== null &&
      typeof value.supplementalStationExtraction.timestamp !== "string") ||
    (value.supplementalStationExtraction.query !== null &&
      typeof value.supplementalStationExtraction.query !== "string")
  ) {
    return false;
  }

  return value.features.every((feature: unknown) => {
    if (!isRecord(feature) || feature.type !== "Feature") return false;
    if (!isRecord(feature.properties) || !isRecord(feature.geometry)) return false;

    if (feature.properties.kind === "route") {
      return (
        feature.geometry.type === "MultiLineString" &&
        Array.isArray(feature.geometry.coordinates) &&
        feature.geometry.coordinates.every(
          (line: unknown) =>
            Array.isArray(line) &&
            line.length >= 2 &&
            line.every(isPosition),
        ) &&
        typeof feature.properties.lineCode === "string" &&
        typeof feature.properties.name === "string" &&
        typeof feature.properties.color === "string"
      );
    }

    return (
      feature.properties.kind === "station" &&
      feature.geometry.type === "Point" &&
      isPosition(feature.geometry.coordinates) &&
      typeof feature.properties.stationCode === "string" &&
      typeof feature.properties.name === "string" &&
      Array.isArray(feature.properties.lineCodes) &&
      feature.properties.lineCodes.every(
        (lineCode: unknown) => typeof lineCode === "string",
      )
    );
  });
}

function isMtrStationValidation(value: unknown): value is MtrStationValidation {
  if (
    !isRecord(value) ||
    typeof value.name !== "string" ||
    typeof value.provider !== "string" ||
    typeof value.source !== "string" ||
    typeof value.catalogUrl !== "string" ||
    typeof value.termsUrl !== "string" ||
    typeof value.updatedAt !== "string" ||
    !Array.isArray(value.stationCodeAliases) ||
    !value.stationCodeAliases.every(
      (alias) =>
        isRecord(alias) &&
        typeof alias.osmCode === "string" &&
        typeof alias.officialCode === "string" &&
        typeof alias.stationName === "string",
    ) ||
    !isRecord(value.stationSequenceComparison)
  ) {
    return false;
  }

  return Object.values(value.stationSequenceComparison).every(
    (comparison) =>
      isRecord(comparison) &&
      typeof comparison.officialCount === "number" &&
      typeof comparison.osmCount === "number" &&
      Array.isArray(comparison.missingFromRouteStops) &&
      comparison.missingFromRouteStops.every(
        (stationCode) => typeof stationCode === "string",
      ) &&
      Array.isArray(comparison.notInOfficialCsv) &&
      comparison.notInOfficialCsv.every(
        (stationCode) => typeof stationCode === "string",
      ) &&
      isRecord(comparison.relationSequenceComparison) &&
      typeof comparison.relationSequenceComparison.relationCount ===
        "number" &&
      typeof comparison.relationSequenceComparison.exactOrderMatches ===
        "number" &&
      Array.isArray(
        comparison.relationSequenceComparison.unmatchedRelationIds,
      ),
  );
}

function makeFeatureCollection<G extends MultiLineString | Point>(
  features: Array<Feature<G, MtrRouteProperties | MtrStationProperties>>,
): FeatureCollection<G, MtrRouteProperties | MtrStationProperties> {
  return { type: "FeatureCollection", features };
}

export function HongKongMap() {
  const [mtrData, setMtrData] = useState<MtrMapFeatureCollection | null>(null);
  const [stationValidation, setStationValidation] =
    useState<MtrStationValidation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMtrData() {
      setLoadError(null);

      try {
        const [mapResponse, validationResponse] = await Promise.all([
          fetch("/data/mtr-osm.geojson", { signal: controller.signal }),
          fetch("/data/mtr-station-validation.json", {
            signal: controller.signal,
          }),
        ]);

        if (!mapResponse.ok || !validationResponse.ok) {
          throw new Error(
            `Map data requests failed (${mapResponse.status}, ${validationResponse.status}).`,
          );
        }

        const [mapResult, validationResult]: [unknown, unknown] =
          await Promise.all([mapResponse.json(), validationResponse.json()]);
        if (!isMtrMapData(mapResult)) {
          throw new Error("The MTR GeoJSON file has an unexpected format.");
        }
        if (!isMtrStationValidation(validationResult)) {
          throw new Error("The MTR station comparison file is invalid.");
        }

        setMtrData(mapResult);
        setStationValidation(validationResult);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "The MTR map data could not be loaded.",
        );
      }
    }

    void loadMtrData();
    return () => controller.abort();
  }, [retryCount]);

  const routeFeatures = useMemo(
    () =>
      mtrData?.features.filter(
        (feature): feature is Feature<MultiLineString, MtrRouteProperties> =>
          feature.properties.kind === "route" &&
          feature.geometry.type === "MultiLineString",
      ) ?? [],
    [mtrData],
  );
  const stationFeatures = useMemo(
    () =>
      mtrData?.features.filter(
        (feature): feature is Feature<Point, MtrStationProperties> =>
          feature.properties.kind === "station" &&
          feature.geometry.type === "Point",
      ) ?? [],
    [mtrData],
  );
  const routeColors = useMemo(
    () => new Map(routeFeatures.map(({ properties }) => [properties.lineCode, properties.color])),
    [routeFeatures],
  );
  const routeCollection = useMemo(
    () => makeFeatureCollection(routeFeatures),
    [routeFeatures],
  );
  const stationDiscrepancies = useMemo(
    () =>
      Object.entries(
        stationValidation?.stationSequenceComparison ?? {},
      )
        .filter(
          ([, comparison]) =>
            comparison.missingFromRouteStops.length > 0 ||
            comparison.notInOfficialCsv.length > 0,
        )
        .map(([lineCode, comparison]) => {
          const differences: string[] = [];
          if (comparison.missingFromRouteStops.length > 0) {
            differences.push(
              `official stop codes absent from OSM route relations: ${comparison.missingFromRouteStops.join(", ")}`,
            );
          }
          if (comparison.notInOfficialCsv.length > 0) {
            differences.push(
              `OSM route-stop code not listed ${comparison.notInOfficialCsv.join(", ")}`,
            );
          }
          return `${lineCode}: ${differences.join("; ")}`;
        }),
    [stationValidation],
  );
  const routeSequenceSummary = useMemo(
    () =>
      Object.values(
        stationValidation?.stationSequenceComparison ?? {},
      ).reduce(
        (summary, comparison) => ({
          matched:
            summary.matched +
            comparison.relationSequenceComparison.exactOrderMatches,
          total:
            summary.total +
            comparison.relationSequenceComparison.relationCount,
        }),
        { matched: 0, total: 0 },
      ),
    [stationValidation],
  );

  return (
    <section className="map-section" aria-labelledby="hong-kong-map-heading">
      <div className="map-section-heading">
        <div>
          <p className="eyebrow">Hong Kong game map</p>
          <h2 id="hong-kong-map-heading">Explore the playable city.</h2>
        </div>
        <span className="map-status">MTR OSM data</span>
      </div>
      <p className="map-description">
        Explore OpenStreetMap-derived MTR routes and station locations. Toggle
        the route and station overlays independently.
      </p>
      <div className="interactive-map-shell">
        <MapContainer
          center={hongKongCenter}
          className="interactive-map"
          scrollWheelZoom
          zoom={11}
          zoomControl={false}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            {mtrData && (
              <>
                <LayersControl.Overlay checked name="MTR routes (OpenStreetMap)">
                  <GeoJSON
                    data={routeCollection}
                    style={(feature) => ({
                      color: feature?.properties?.color ?? "#3e765e",
                      weight: 3,
                      opacity: 0.9,
                    })}
                  />
                </LayersControl.Overlay>
                <LayersControl.Overlay checked name="MTR stations">
                  <FeatureGroup>
                    {stationFeatures.map((feature) => {
                      const [longitude, latitude] =
                        feature.geometry.coordinates;
                      const color =
                        feature.properties.lineCodes
                          .map((lineCode) => routeColors.get(lineCode))
                          .find(Boolean) ?? "#3e765e";

                      return (
                        <CircleMarker
                          center={[latitude, longitude]}
                          key={feature.properties.stationCode}
                          pathOptions={{
                            color,
                            fillColor: "#ffffff",
                            fillOpacity: 1,
                            weight: 2,
                          }}
                          radius={4}
                        >
                          <Tooltip>{feature.properties.name}</Tooltip>
                        </CircleMarker>
                      );
                    })}
                  </FeatureGroup>
                </LayersControl.Overlay>
              </>
            )}
          </LayersControl>
          <Circle
            center={hongKongCenter}
            pathOptions={{ color: "#3e765e", fillOpacity: 0.08 }}
            radius={500}
          />
          <ZoomControl position="bottomright" />
        </MapContainer>
      </div>
      <div className="map-legend" aria-label="Map layer legend">
        <span>
          <i className="legend-swatch legend-swatch-base" /> OpenStreetMap base
        </span>
        <span>
          <i className="legend-swatch legend-swatch-radius" /> Reference-radius
          preview
        </span>
        <span>
          <i className="legend-swatch legend-swatch-mtr" /> MTR routes and stations
        </span>
      </div>
      <p className="map-source-note">
        <strong>Map and transit data:</strong>{" "}
        <a
          href={mtrDataSource.openStreetMap.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          © OpenStreetMap contributors
        </a>
        . The OSM-derived transit data in this app is available under the{" "}
        <a
          href={mtrDataSource.openStreetMap.licenseUrl}
          rel="noreferrer"
          target="_blank"
        >
          {mtrDataSource.openStreetMap.license}
        </a>
        . Route/stop snapshot: {mtrData?.extractedAt ?? "loading"};{" "}
        {mtrData?.supplementalStationExtraction.timestamp
          ? `additional station-point snapshot: ${mtrData.supplementalStationExtraction.timestamp}.`
          : "no supplemental station-point extract."}
      </p>
      <p className="map-source-note">
        Station names and order were cross-checked against the{" "}
        <a href={mtrDataSource.officialStationList.catalogUrl} rel="noreferrer" target="_blank">
          MTR Lines &amp; Stations dataset
        </a>{" "}
        ({mtrDataSource.officialStationList.provider}, last updated{" "}
        {mtrDataSource.officialStationList.updatedAt});{" "}
        {routeSequenceSummary.matched}/{routeSequenceSummary.total} OSM route
        relation sequences exactly match a complete listed direction; other
        relations may represent partial or variant services. The differences
        below compare OSM route-relation stop members; they do not necessarily
        mean a station marker is missing
        {stationDiscrepancies.length > 0
          ? `: ${stationDiscrepancies.join("; ")}.`
          : "."}{" "}
        {stationValidation?.stationCodeAliases.map(
          ({ osmCode, officialCode, stationName }) =>
            `For comparison only, OSM ${stationName} code ${osmCode} is matched to MTR code ${officialCode}; the OSM snapshot retains its original tag. `,
        )}
        OSM also includes EAL stop RAC (Racecourse), shown on the{" "}
        <a
          href={mtrDataSource.officialStationList.systemMapUrl}
          rel="noreferrer"
          target="_blank"
        >
          current MTR System Map
        </a>
        , but not listed in the MTR station-sequence CSV.{" "}
        The data is provided as-is and should be visually checked before
        gameplay use.{" "}
        <a href={mtrDataSource.officialStationList.termsUrl} rel="noreferrer" target="_blank">
          DATA.GOV.HK reuse terms
        </a>
        .
      </p>
      {mtrData && (
        <p className="map-data-status" role="status">
          Loaded {routeFeatures.length} MTR lines and {stationFeatures.length}{" "}
          station points from the versioned OSM snapshot.
        </p>
      )}
      {!mtrData && !loadError && (
        <p className="map-data-status" role="status">
          Loading MTR route and station data…
        </p>
      )}
      {loadError && (
        <div className="map-data-error" role="alert">
          <span>MTR map data could not be loaded: {loadError}</span>
          <button
            className="button button-secondary"
            onClick={() => setRetryCount((count) => count + 1)}
            type="button"
          >
            Retry
          </button>
        </div>
      )}
    </section>
  );
}
