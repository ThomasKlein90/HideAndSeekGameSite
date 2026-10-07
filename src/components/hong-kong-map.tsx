"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  MultiLineString,
  Point,
} from "geojson";
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
  type FerryRouteProperties,
  type FerryTerminalProperties,
  type HongKongFerryFeatureCollection,
  mtrDataSource,
  type HongKongTramwaysFeatureCollection,
  type LightRailRouteProperties,
  type LightRailStopProperties,
  type MtrMapFeatureCollection,
  type MtrLightRailFeatureCollection,
  type MtrRouteProperties,
  type MtrStationValidation,
  type MtrStationProperties,
  type TramRouteProperties,
  type TramStopProperties,
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

function isHongKongTramwaysData(
  value: unknown,
): value is HongKongTramwaysFeatureCollection {
  if (
    !isRecord(value) ||
    value.type !== "FeatureCollection" ||
    !Array.isArray(value.features) ||
    typeof value.license !== "string" ||
    typeof value.attribution !== "string" ||
    typeof value.source !== "string" ||
    typeof value.extractedAt !== "string" ||
    typeof value.extractionQuery !== "string"
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
            Array.isArray(line) && line.length >= 2 && line.every(isPosition),
        ) &&
        typeof feature.properties.serviceName === "string" &&
        typeof feature.properties.name === "string" &&
        typeof feature.properties.color === "string"
      );
    }

    return (
      feature.properties.kind === "stop" &&
      feature.geometry.type === "Point" &&
      isPosition(feature.geometry.coordinates) &&
      typeof feature.properties.name === "string" &&
      (typeof feature.properties.reference === "string" ||
        feature.properties.reference === null) &&
      Array.isArray(feature.properties.serviceNames) &&
      feature.properties.serviceNames.every(
        (serviceName: unknown) => typeof serviceName === "string",
      )
    );
  });
}

function isMtrLightRailData(
  value: unknown,
): value is MtrLightRailFeatureCollection {
  if (
    !isRecord(value) ||
    value.type !== "FeatureCollection" ||
    !Array.isArray(value.features) ||
    typeof value.license !== "string" ||
    typeof value.attribution !== "string" ||
    typeof value.source !== "string" ||
    (value.extractedAt !== null && typeof value.extractedAt !== "string") ||
    typeof value.extractionQuery !== "string"
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
        feature.geometry.coordinates.length > 0 &&
        feature.geometry.coordinates.every(
          (line: unknown) =>
            Array.isArray(line) && line.length >= 2 && line.every(isPosition),
        ) &&
        typeof feature.properties.routeCode === "string" &&
        typeof feature.properties.name === "string" &&
        typeof feature.properties.osmWayCount === "number" &&
        Array.isArray(feature.properties.osmRelationIds) &&
        feature.properties.osmRelationIds.every(
          (relationId: unknown) => typeof relationId === "number",
        ) &&
        Array.isArray(feature.properties.serviceNames) &&
        feature.properties.serviceNames.every(
          (serviceName: unknown) => typeof serviceName === "string",
        )
      );
    }

    return (
      feature.properties.kind === "stop" &&
      feature.geometry.type === "Point" &&
      isPosition(feature.geometry.coordinates) &&
      typeof feature.properties.name === "string" &&
      (typeof feature.properties.reference === "string" ||
        feature.properties.reference === null) &&
      Array.isArray(feature.properties.routeCodes) &&
      feature.properties.routeCodes.every(
        (routeCode: unknown) => typeof routeCode === "string",
      ) &&
      Array.isArray(feature.properties.osmNodeIds) &&
      feature.properties.osmNodeIds.every(
        (nodeId: unknown) => typeof nodeId === "number",
      )
    );
  });
}

function isHongKongFerryData(
  value: unknown,
): value is HongKongFerryFeatureCollection {
  if (
    !isRecord(value) ||
    value.type !== "FeatureCollection" ||
    !Array.isArray(value.features) ||
    typeof value.license !== "string" ||
    typeof value.attribution !== "string" ||
    typeof value.source !== "string" ||
    (value.extractedAt !== null && typeof value.extractedAt !== "string") ||
    typeof value.extractionQuery !== "string" ||
    typeof value.scope !== "string"
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
        feature.geometry.coordinates.length > 0 &&
        feature.geometry.coordinates.every(
          (line: unknown) =>
            Array.isArray(line) && line.length >= 2 && line.every(isPosition),
        ) &&
        typeof feature.properties.serviceKey === "string" &&
        typeof feature.properties.name === "string" &&
        Array.isArray(feature.properties.serviceNames) &&
        feature.properties.serviceNames.every(
          (serviceName: unknown) => typeof serviceName === "string",
        ) &&
        Array.isArray(feature.properties.operators) &&
        feature.properties.operators.every(
          (operator: unknown) => typeof operator === "string",
        ) &&
        Array.isArray(feature.properties.osmRelationIds) &&
        feature.properties.osmRelationIds.every(
          (relationId: unknown) => typeof relationId === "number",
        )
      );
    }

    return (
      feature.properties.kind === "terminal" &&
      feature.geometry.type === "Point" &&
      isPosition(feature.geometry.coordinates) &&
      typeof feature.properties.name === "string" &&
      (typeof feature.properties.reference === "string" ||
        feature.properties.reference === null) &&
      Array.isArray(feature.properties.serviceNames) &&
      feature.properties.serviceNames.every(
        (serviceName: unknown) => typeof serviceName === "string",
      ) &&
      Array.isArray(feature.properties.osmElementIds) &&
      feature.properties.osmElementIds.length > 0 &&
      feature.properties.osmElementIds.every(
        (elementId: unknown) => typeof elementId === "string",
      )
    );
  });
}

function makeFeatureCollection<
  G extends MultiLineString | Point,
  P extends GeoJsonProperties,
>(features: Array<Feature<G, P>>): FeatureCollection<G, P> {
  return { type: "FeatureCollection", features };
}

export function HongKongMap() {
  const [mtrData, setMtrData] = useState<MtrMapFeatureCollection | null>(null);
  const [tramData, setTramData] =
    useState<HongKongTramwaysFeatureCollection | null>(null);
  const [lightRailData, setLightRailData] =
    useState<MtrLightRailFeatureCollection | null>(null);
  const [ferryData, setFerryData] =
    useState<HongKongFerryFeatureCollection | null>(null);
  const [stationValidation, setStationValidation] =
    useState<MtrStationValidation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadMtrData() {
      setLoadError(null);

      try {
        const [
          mapResponse,
          validationResponse,
          tramResponse,
          lightRailResponse,
          ferryResponse,
        ] = await Promise.all([
          fetch("/data/mtr-osm.geojson", { signal: controller.signal }),
          fetch("/data/mtr-station-validation.json", {
            signal: controller.signal,
          }),
          fetch("/data/hong-kong-tramways.geojson", {
            signal: controller.signal,
          }),
          fetch("/data/mtr-light-rail.geojson", {
            signal: controller.signal,
          }),
          fetch("/data/hong-kong-ferries.geojson", {
            signal: controller.signal,
          }),
        ]);

        if (
          !mapResponse.ok ||
          !validationResponse.ok ||
          !tramResponse.ok ||
          !lightRailResponse.ok ||
          !ferryResponse.ok
        ) {
          throw new Error(
            `Map data requests failed (${mapResponse.status}, ${validationResponse.status}, ${tramResponse.status}, ${lightRailResponse.status}, ${ferryResponse.status}).`,
          );
        }

        const [
          mapResult,
          validationResult,
          tramResult,
          lightRailResult,
          ferryResult,
        ]: [
          unknown,
          unknown,
          unknown,
          unknown,
          unknown,
        ] = await Promise.all([
          mapResponse.json(),
          validationResponse.json(),
          tramResponse.json(),
          lightRailResponse.json(),
          ferryResponse.json(),
        ]);
        if (!isMtrMapData(mapResult)) {
          throw new Error("The MTR GeoJSON file has an unexpected format.");
        }
        if (!isMtrStationValidation(validationResult)) {
          throw new Error("The MTR station comparison file is invalid.");
        }
        if (!isHongKongTramwaysData(tramResult)) {
          throw new Error("The Hong Kong Tramways GeoJSON file is invalid.");
        }
        if (!isMtrLightRailData(lightRailResult)) {
          throw new Error("The MTR Light Rail GeoJSON file is invalid.");
        }
        if (!isHongKongFerryData(ferryResult)) {
          throw new Error("The Hong Kong ferry GeoJSON file is invalid.");
        }

        setMtrData(mapResult);
        setStationValidation(validationResult);
        setTramData(tramResult);
        setLightRailData(lightRailResult);
        setFerryData(ferryResult);
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
  const tramRouteFeatures = useMemo(
    () =>
      tramData?.features.filter(
        (feature): feature is Feature<MultiLineString, TramRouteProperties> =>
          feature.properties.kind === "route" &&
          feature.geometry.type === "MultiLineString",
      ) ?? [],
    [tramData],
  );
  const tramStopFeatures = useMemo(
    () =>
      tramData?.features.filter(
        (feature): feature is Feature<Point, TramStopProperties> =>
          feature.properties.kind === "stop" &&
          feature.geometry.type === "Point",
      ) ?? [],
    [tramData],
  );
  const lightRailRouteFeatures = useMemo(
    () =>
      lightRailData?.features.filter(
        (feature): feature is Feature<MultiLineString, LightRailRouteProperties> =>
          feature.properties.kind === "route" &&
          feature.geometry.type === "MultiLineString",
      ) ?? [],
    [lightRailData],
  );
  const lightRailStopFeatures = useMemo(
    () =>
      lightRailData?.features.filter(
        (feature): feature is Feature<Point, LightRailStopProperties> =>
          feature.properties.kind === "stop" &&
          feature.geometry.type === "Point",
      ) ?? [],
    [lightRailData],
  );
  const ferryRouteFeatures = useMemo(
    () =>
      ferryData?.features.filter(
        (feature): feature is Feature<MultiLineString, FerryRouteProperties> =>
          feature.properties.kind === "route" &&
          feature.geometry.type === "MultiLineString",
      ) ?? [],
    [ferryData],
  );
  const ferryTerminalFeatures = useMemo(
    () =>
      ferryData?.features.filter(
        (feature): feature is Feature<Point, FerryTerminalProperties> =>
          feature.properties.kind === "terminal" &&
          feature.geometry.type === "Point",
      ) ?? [],
    [ferryData],
  );
  const routeColors = useMemo(
    () => new Map(routeFeatures.map(({ properties }) => [properties.lineCode, properties.color])),
    [routeFeatures],
  );
  const routeCollection = useMemo(
    () => makeFeatureCollection(routeFeatures),
    [routeFeatures],
  );
  const tramRouteCollection = useMemo(
    () => makeFeatureCollection(tramRouteFeatures),
    [tramRouteFeatures],
  );
  const lightRailRouteCollection = useMemo(
    () => makeFeatureCollection(lightRailRouteFeatures),
    [lightRailRouteFeatures],
  );
  const ferryRouteCollection = useMemo(
    () => makeFeatureCollection(ferryRouteFeatures),
    [ferryRouteFeatures],
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
        <span className="map-status">
          MTR + Tram + Light Rail + Ferry OSM data
        </span>
      </div>
      <p className="map-description">
        Explore OpenStreetMap-derived MTR, Hong Kong Tramways, Light Rail, and
        ferry routes and terminals. Toggle each layer independently.
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
            {tramData && (
              <>
                <LayersControl.Overlay checked name="Hong Kong Tramways routes">
                  <GeoJSON
                    data={tramRouteCollection}
                    style={(feature) => ({
                      color: feature?.properties?.color ?? "#309ad0",
                      weight: 3,
                      opacity: 0.9,
                    })}
                  />
                </LayersControl.Overlay>
                <LayersControl.Overlay checked name="Hong Kong Tramways stops">
                  <FeatureGroup>
                    {tramStopFeatures.map((feature) => {
                      const [longitude, latitude] =
                        feature.geometry.coordinates;

                      return (
                        <CircleMarker
                          center={[latitude, longitude]}
                          key={feature.properties.osmNodeIds[0]}
                          pathOptions={{
                            color: "#164c68",
                            fillColor: "#ffffff",
                            fillOpacity: 1,
                            weight: 2,
                          }}
                          radius={2}
                        >
                          <Tooltip>
                            {feature.properties.name}
                            {feature.properties.reference
                              ? ` (${feature.properties.reference})`
                              : ""}
                          </Tooltip>
                        </CircleMarker>
                      );
                    })}
                  </FeatureGroup>
                </LayersControl.Overlay>
              </>
            )}
            {lightRailData && (
              <>
                <LayersControl.Overlay checked name="MTR Light Rail routes">
                  <GeoJSON
                    data={lightRailRouteCollection}
                    style={() => ({
                      color: "#8552a3",
                      weight: 3,
                      opacity: 0.9,
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindTooltip(
                        feature.properties?.name ?? "MTR Light Rail route",
                      );
                    }}
                  />
                </LayersControl.Overlay>
                <LayersControl.Overlay checked name="MTR Light Rail stops">
                  <FeatureGroup>
                    {lightRailStopFeatures.map((feature) => {
                      const [longitude, latitude] =
                        feature.geometry.coordinates;

                      return (
                        <CircleMarker
                          center={[latitude, longitude]}
                          key={feature.properties.osmNodeIds[0]}
                          pathOptions={{
                            color: "#57356e",
                            fillColor: "#ffffff",
                            fillOpacity: 1,
                            weight: 2,
                          }}
                          radius={3}
                        >
                          <Tooltip>
                            {feature.properties.name}
                            {feature.properties.reference
                              ? ` (${feature.properties.reference})`
                              : ""}
                          </Tooltip>
                        </CircleMarker>
                      );
                    })}
                  </FeatureGroup>
                </LayersControl.Overlay>
              </>
            )}
            {ferryData && (
              <>
                <LayersControl.Overlay checked name="Hong Kong ferry routes">
                  <GeoJSON
                    data={ferryRouteCollection}
                    style={() => ({
                      color: "#d16f42",
                      dashArray: "6 5",
                      opacity: 0.9,
                      weight: 2,
                    })}
                    onEachFeature={(feature, layer) => {
                      layer.bindTooltip(
                        feature.properties?.name ?? "Hong Kong ferry route",
                      );
                    }}
                  />
                </LayersControl.Overlay>
                <LayersControl.Overlay checked name="Hong Kong ferry terminals">
                  <FeatureGroup>
                    {ferryTerminalFeatures.map((feature) => {
                      const [longitude, latitude] =
                        feature.geometry.coordinates;

                      return (
                        <CircleMarker
                          center={[latitude, longitude]}
                          key={feature.properties.osmElementIds[0]}
                          pathOptions={{
                            color: "#8c4629",
                            fillColor: "#fff4ec",
                            fillOpacity: 1,
                            weight: 2,
                          }}
                          radius={3}
                        >
                          <Tooltip>
                            {feature.properties.name}
                            {feature.properties.reference
                              ? ` (${feature.properties.reference})`
                              : ""}
                          </Tooltip>
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
        <span>
          <i className="legend-swatch legend-swatch-tram" /> Hong Kong Tramways
          routes and stops
        </span>
        <span>
          <i className="legend-swatch legend-swatch-light-rail" /> MTR Light Rail
          routes and stops
        </span>
        <span>
          <i className="legend-swatch legend-swatch-ferry" /> Hong Kong ferry
          routes and terminals
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
      <p className="map-source-note">
        Hong Kong Tramways routes and stops are also derived from{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          rel="noreferrer"
          target="_blank"
        >
          OpenStreetMap
        </a>{" "}
        under the ODbL 1.0; this snapshot includes {tramRouteFeatures.length}{" "}
        route services and {tramStopFeatures.length} stop locations
        {tramData?.extractedAt ? `, extracted ${tramData.extractedAt}` : ""}.
        Route and stop coverage is based on OSM public transport relations and
        should be treated as a reference layer.
      </p>
      <p className="map-source-note">
        MTR Light Rail routes and stops are derived from{" "}
        <a
          href={mtrDataSource.openStreetMap.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          OpenStreetMap
        </a>{" "}
        under the ODbL 1.0; this snapshot includes{" "}
        {lightRailRouteFeatures.length} route references and{" "}
        {lightRailStopFeatures.length} stop/platform locations
        {lightRailData?.extractedAt
          ? `, extracted ${lightRailData.extractedAt}`
          : ""}
        . OSM route relations are a reference layer, not an operator-certified
        service feed.
      </p>
      <p className="map-source-note">
        Hong Kong local ferry routes and terminals are derived from{" "}
        <a
          href={mtrDataSource.openStreetMap.sourceUrl}
          rel="noreferrer"
          target="_blank"
        >
          OpenStreetMap
        </a>{" "}
        under the ODbL 1.0; this snapshot includes {ferryRouteFeatures.length}{" "}
        mapped route groups and {ferryTerminalFeatures.length} terminal points
        {ferryData?.extractedAt ? `, extracted ${ferryData.extractedAt}` : ""}.
        Cross-border services are excluded. Coverage follows mapped local ferry
        relations and terminals and is not an official service list or schedule.
        The Transport Department{" "}
        <a
          href="https://www.td.gov.hk/en/transport_in_hong_kong/public_transport/ferries/index.html"
          rel="noreferrer"
          target="_blank"
        >
          ferry listings
        </a>{" "}
        report 21 regular licensed passenger services (as of 31 December 2024)
        and two franchised Star Ferry routes. This OSM snapshot does not include
        Star Ferry route geometry, so mapped coverage is incomplete.
      </p>
      {mtrData && (
        <p className="map-data-status" role="status">
          Loaded {routeFeatures.length} MTR lines, {stationFeatures.length} MTR
          station points, {tramRouteFeatures.length} tram services,{" "}
          {tramStopFeatures.length} tram stops, {lightRailRouteFeatures.length}{" "}
          Light Rail route references, {lightRailStopFeatures.length} Light
          Rail stop/platform points, {ferryRouteFeatures.length} ferry route
          groups, and {ferryTerminalFeatures.length} ferry terminals from
          versioned OSM snapshots.
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
