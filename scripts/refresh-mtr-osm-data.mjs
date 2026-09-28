import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const bounds = "22.1,113.8,22.6,114.4";
const query = `[out:json][timeout:90];relation[route=subway][operator~"MTR"](${bounds})->.routes;(.routes;node(r.routes););out body geom;`;
const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const mtrCsvUrl = "https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv";
const outputPath = resolve("public/data/mtr-osm.geojson");
const validationOutputPath = resolve("public/data/mtr-station-validation.json");

async function fetchText(url, resourceName) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json,text/csv;q=0.9,*/*;q=0.8",
      "user-agent": "HideAndSeekGameSite MTR map data refresh",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download ${resourceName}: ${response.status} ${response.statusText}`,
    );
  }

  return response.text();
}

function parseCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted && character === '"' && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(field);
      field = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
}

function cleanLineName(value = "") {
  return value.replace(/^MTR\s+/i, "").replace(/\s+\([^)]*\)$/, "").trim();
}

function hasSameOrder(first, second) {
  return (
    (first.length === second.length &&
      first.every((stationCode, index) => stationCode === second[index])) ||
    (first.length === second.length &&
      first.every(
        (stationCode, index) =>
          stationCode === second[second.length - index - 1],
      ))
  );
}

function missingStationCodes(osm, officialCsv) {
  const routeStopCodes = new Set();
  const nodes = new Map(
    osm.elements
      .filter((element) => element.type === "node")
      .map((element) => [element.id, element]),
  );

  for (const relation of osm.elements.filter(
    (element) => element.type === "relation",
  )) {
    for (const member of relation.members ?? []) {
      if (member.type !== "node" || !member.role?.startsWith("stop")) continue;
      const stationCode = nodes.get(member.ref)?.tags?.ref;
      if (stationCode) routeStopCodes.add(stationCode);
    }
  }

  return [
    ...new Set(
      officialCsv
        .filter((record) => record["Line Code"] && record["Station Code"])
        .map((record) => record["Station Code"]),
    ),
  ]
    .filter((stationCode) => !routeStopCodes.has(stationCode))
    .sort();
}

function buildGeoJson(osm, officialCsv, additionalStations) {
  const nodes = new Map(
    osm.elements
      .filter((element) => element.type === "node")
      .map((element) => [element.id, element]),
  );
  const routes = new Map();
  const stations = new Map();
  const osmStationCodesByLine = new Map();
  const officialStationCodesByLine = new Map();
  const officialSequencesByLine = new Map();
  const relationSequenceComparison = new Map();
  const officialLinesByStationCode = new Map();

  for (const record of officialCsv) {
    const lineCode = record["Line Code"];
    const stationCode = record["Station Code"];
    if (!lineCode || !stationCode) continue;
    const codes = officialStationCodesByLine.get(lineCode) ?? new Set();
    codes.add(stationCode);
    officialStationCodesByLine.set(lineCode, codes);
    const stationLines = officialLinesByStationCode.get(stationCode) ?? new Set();
    stationLines.add(lineCode);
    officialLinesByStationCode.set(stationCode, stationLines);

    const directionSequences = officialSequencesByLine.get(lineCode) ?? new Map();
    const sequence = directionSequences.get(record.Direction) ?? [];
    sequence.push({
      stationCode,
      order: Number.parseFloat(record.Sequence) || sequence.length + 1,
    });
    directionSequences.set(record.Direction, sequence);
    officialSequencesByLine.set(lineCode, directionSequences);
  }

  for (const directionSequences of officialSequencesByLine.values()) {
    for (const sequence of directionSequences.values()) {
      sequence.sort((first, second) => first.order - second.order);
    }
  }

  for (const relation of osm.elements.filter(
    (element) => element.type === "relation" && element.tags?.ref,
  )) {
    const { tags } = relation;
    const lineCode = tags.ref;
    const route = routes.get(lineCode) ?? {
      name: cleanLineName(tags["name:en"] ?? tags.name ?? lineCode),
      color: tags.colour ?? "#3e765e",
      relationIds: new Set(),
      ways: new Map(),
    };
    route.relationIds.add(relation.id);

    const stationCodes = osmStationCodesByLine.get(lineCode) ?? new Set();
    const orderedStationCodes = [];

    for (const member of relation.members ?? []) {
      if (member.type === "way" && member.geometry?.length > 1) {
        route.ways.set(
          member.ref,
          member.geometry.map(({ lon, lat }) => [lon, lat]),
        );
      }

      if (
        member.type !== "node" ||
        !member.role?.startsWith("stop") ||
        !member.ref
      ) {
        continue;
      }

      const node = nodes.get(member.ref);
      const stationCode = node?.tags?.ref;
      if (!node || !stationCode || !Number.isFinite(node.lat) || !Number.isFinite(node.lon)) {
        continue;
      }

      stationCodes.add(stationCode);
      orderedStationCodes.push(stationCode);
      const station = stations.get(stationCode) ?? {
        name: node.tags["name:en"] ?? node.tags.name ?? stationCode,
        coordinates: [],
        lineCodes: new Set(),
        osmNodeIds: new Set(),
      };
      station.coordinates.push([node.lon, node.lat]);
      station.lineCodes.add(lineCode);
      station.osmNodeIds.add(node.id);
      stations.set(stationCode, station);
    }

    routes.set(lineCode, route);
    osmStationCodesByLine.set(lineCode, stationCodes);
    const lineSequences = relationSequenceComparison.get(lineCode) ?? {
      relationCount: 0,
      exactOrderMatches: 0,
      unmatchedRelationIds: [],
    };
    const officialSequences = [
      ...(officialSequencesByLine.get(lineCode)?.values() ?? []),
    ].map((sequence) => sequence.map(({ stationCode }) => stationCode));
    lineSequences.relationCount += 1;
    if (
      officialSequences.some((sequence) =>
        hasSameOrder(orderedStationCodes, sequence),
      )
    ) {
      lineSequences.exactOrderMatches += 1;
    } else {
      lineSequences.unmatchedRelationIds.push(relation.id);
    }
    relationSequenceComparison.set(lineCode, lineSequences);
  }

  for (const node of additionalStations.elements ?? []) {
    const stationCode = node.tags?.ref;
    if (
      node.type !== "node" ||
      !stationCode ||
      !Number.isFinite(node.lat) ||
      !Number.isFinite(node.lon)
    ) {
      continue;
    }

    const station = stations.get(stationCode) ?? {
      name: node.tags["name:en"] ?? node.tags.name ?? stationCode,
      coordinates: [],
      lineCodes: new Set(),
      osmNodeIds: new Set(),
    };
    station.coordinates.push([node.lon, node.lat]);
    station.osmNodeIds.add(node.id);
    for (const lineCode of officialLinesByStationCode.get(stationCode) ?? []) {
      station.lineCodes.add(lineCode);
    }
    stations.set(stationCode, station);
  }

  const stationComparison = {};
  for (const lineCode of new Set([
    ...officialStationCodesByLine.keys(),
    ...osmStationCodesByLine.keys(),
  ])) {
    const officialCodes = officialStationCodesByLine.get(lineCode) ?? new Set();
    const osmCodes = osmStationCodesByLine.get(lineCode) ?? new Set();
    stationComparison[lineCode] = {
      officialCount: officialCodes.size,
      osmCount: osmCodes.size,
      missingFromOsm: [...officialCodes].filter((code) => !osmCodes.has(code)).sort(),
      notInOfficialCsv: [...osmCodes].filter((code) => !officialCodes.has(code)).sort(),
      relationSequenceComparison: relationSequenceComparison.get(lineCode) ?? {
        relationCount: 0,
        exactOrderMatches: 0,
        unmatchedRelationIds: [],
      },
    };
  }

  const features = [];
  for (const [lineCode, route] of routes) {
    features.push({
      type: "Feature",
      properties: {
        kind: "route",
        lineCode,
        name: route.name,
        color: route.color,
        osmRelationIds: [...route.relationIds].sort((a, b) => a - b),
        osmWayCount: route.ways.size,
      },
      geometry: {
        type: "MultiLineString",
        coordinates: [...route.ways.values()],
      },
    });
  }

  for (const [stationCode, station] of stations) {
    const coordinateCount = station.coordinates.length;
    const [longitude, latitude] = station.coordinates.reduce(
      ([longitudeSum, latitudeSum], [lon, lat]) => [
        longitudeSum + lon / coordinateCount,
        latitudeSum + lat / coordinateCount,
      ],
      [0, 0],
    );
    features.push({
      type: "Feature",
      properties: {
        kind: "station",
        stationCode,
        name: station.name,
        lineCodes: [...station.lineCodes].sort(),
        osmNodeIds: [...station.osmNodeIds].sort((a, b) => a - b),
      },
      geometry: { type: "Point", coordinates: [longitude, latitude] },
    });
  }

  const geoJson = {
    type: "FeatureCollection",
    name: "Hong Kong MTR routes and stations",
    license: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    source: "https://www.openstreetmap.org/copyright",
    extractedAt: osm.osm3s.timestamp_osm_base,
    extractionQuery: query,
    supplementalStationExtraction: {
      timestamp: additionalStations.osm3s?.timestamp_osm_base ?? null,
      query: additionalStations.query ?? null,
    },
    features,
  };
  const stationValidation = {
    name: "MTR Lines (except Light Rail) & Stations comparison",
    provider: "MTR Corporation Limited via DATA.GOV.HK",
    source: mtrCsvUrl,
    catalogUrl:
      "https://data.gov.hk/en-data/dataset/mtr-data-routes-fares-barrier-free-facilities/resource/8daba4fe-b879-4a51-8962-27b4cffdc61c",
    termsUrl: "https://data.gov.hk/en/terms-and-conditions",
    updatedAt: "2023-06-25",
    stationSequenceComparison: stationComparison,
  };

  return { geoJson, stationValidation };
}

async function main() {
  const [osmInputPath, mtrCsvInputPath, additionalStationInputPath] =
    process.argv.slice(2);
  if (
    Boolean(osmInputPath) !== Boolean(mtrCsvInputPath) ||
    (additionalStationInputPath && !osmInputPath)
  ) {
    throw new Error(
      "Provide both a saved Overpass JSON file and MTR station CSV, optionally with supplemental station JSON, or provide none.",
    );
  }

  const [osmText, mtrCsvText] = osmInputPath
    ? await Promise.all([
        readFile(resolve(osmInputPath), "utf8"),
        readFile(resolve(mtrCsvInputPath), "utf8"),
      ])
    : await Promise.all([
        fetchText(overpassUrl, "OpenStreetMap route geometry"),
        fetchText(mtrCsvUrl, "official MTR station sequence CSV"),
      ]);
  const osm = JSON.parse(osmText);
  const officialCsv = parseCsv(mtrCsvText);
      let additionalStations;

      if (additionalStationInputPath) {
        additionalStations = JSON.parse(
          await readFile(resolve(additionalStationInputPath), "utf8"),
        );
        const codes = missingStationCodes(osm, officialCsv);
        additionalStations.query = `[out:json][timeout:30];node[ref~"^(${codes.join("|")})$"](${bounds});out;`;
      } else if (osmInputPath) {
        additionalStations = { elements: [] };
      } else {
        const codes = missingStationCodes(osm, officialCsv);
        const stationQuery = `[out:json][timeout:30];node[ref~"^(${codes.join("|")})$"](${bounds});out;`;
        const stationUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(stationQuery)}`;
        additionalStations = JSON.parse(
          await fetchText(stationUrl, "additional MTR station locations"),
        );
        additionalStations.query = stationQuery;
      }

      const { geoJson, stationValidation } = buildGeoJson(
        osm,
        officialCsv,
        additionalStations,
      );

      await mkdir(dirname(outputPath), { recursive: true });
      await Promise.all([
        writeFile(outputPath, `${JSON.stringify(geoJson)}\n`, "utf8"),
        writeFile(
          validationOutputPath,
          `${JSON.stringify(stationValidation)}\n`,
          "utf8",
        ),
      ]);

  const routeCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "route",
  ).length;
  const stationCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "station",
  ).length;
  console.log(
    `Wrote ${routeCount} routes and ${stationCount} station points to ${outputPath}`,
  );
  console.log(`Wrote MTR station comparison to ${validationOutputPath}`);
  console.log(
    `OSM snapshot timestamp: ${geoJson.extractedAt}; license: ${geoJson.license}`,
  );
  console.log("Station-code discrepancies by line:");
  for (const [lineCode, result] of Object.entries(
    stationValidation.stationSequenceComparison,
  )) {
    if (
      result.missingFromOsm.length ||
      result.notInOfficialCsv.length ||
      result.relationSequenceComparison.unmatchedRelationIds.length
    ) {
      console.log(
        `${lineCode}: ${result.relationSequenceComparison.exactOrderMatches}/${result.relationSequenceComparison.relationCount} exact direction-order matches; missing from OSM [${result.missingFromOsm.join(", ")}]; OSM-only [${result.notInOfficialCsv.join(", ")}]`,
      );
    }
  }
}

main().catch((error) => {
  console.error("Failed to refresh MTR map data:", error);
  process.exitCode = 1;
});
