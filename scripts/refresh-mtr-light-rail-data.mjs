import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bounds = "22.30,113.85,22.55,114.05";
const query = `[out:json][timeout:90];relation[route=light_rail][ref][network~"Light Rail"](${bounds})->.routes;(.routes;way(r.routes);node(r.routes););out body geom;`;
const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const outputPath = resolve("public/data/mtr-light-rail.geojson");

async function fetchOsmData() {
  const response = await fetch(overpassUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "HideAndSeekGameSite Hong Kong Light Rail data refresh",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download MTR Light Rail geometry: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function buildLightRailGeoJson(osm) {
  const elements = Array.isArray(osm.elements) ? osm.elements : [];
  const nodes = new Map(
    elements
      .filter((element) => element.type === "node")
      .map((element) => [element.id, element]),
  );
  const routes = new Map();
  const stops = new Map();

  for (const relation of elements.filter(
    (element) =>
      element.type === "relation" &&
      element.tags?.route === "light_rail" &&
      typeof element.tags.ref === "string" &&
      /light rail/i.test(element.tags.network ?? ""),
  )) {
    const routeCode = relation.tags.ref;
    const route = routes.get(routeCode) ?? {
      relationIds: new Set(),
      ways: new Map(),
      serviceNames: new Set(),
    };
    route.relationIds.add(relation.id);
    if (relation.tags["name:en"]) route.serviceNames.add(relation.tags["name:en"]);

    for (const member of relation.members ?? []) {
      if (member.type === "way" && member.geometry?.length > 1) {
        route.ways.set(
          member.ref,
          member.geometry.map(({ lon, lat }) => [lon, lat]),
        );
        continue;
      }

      if (
        member.type !== "node" ||
        !/^(stop|platform)/i.test(member.role ?? "") ||
        !member.ref
      ) {
        continue;
      }

      const node = nodes.get(member.ref);
      if (
        !node ||
        !Number.isFinite(node.lat) ||
        !Number.isFinite(node.lon)
      ) {
        continue;
      }

      const stop = stops.get(node.id) ?? {
        name:
          node.tags?.["name:en"] ??
          node.tags?.name ??
          (node.tags?.ref ? `Light Rail stop ${node.tags.ref}` : "Light Rail stop"),
        reference: node.tags?.ref ?? null,
        routeCodes: new Set(),
      };
      stop.routeCodes.add(routeCode);
      stops.set(node.id, {
        ...stop,
        coordinates: [node.lon, node.lat],
      });
    }

    routes.set(routeCode, route);
  }

  const features = [];
  for (const [routeCode, route] of routes) {
    features.push({
      type: "Feature",
      properties: {
        kind: "route",
        routeCode,
        name: `MTR Light Rail ${routeCode}`,
        serviceNames: [...route.serviceNames].sort(),
        osmRelationIds: [...route.relationIds].sort((a, b) => a - b),
        osmWayCount: route.ways.size,
      },
      geometry: {
        type: "MultiLineString",
        coordinates: [...route.ways.values()],
      },
    });
  }

  for (const [nodeId, stop] of stops) {
    features.push({
      type: "Feature",
      properties: {
        kind: "stop",
        name: stop.name,
        reference: stop.reference,
        routeCodes: [...stop.routeCodes].sort(),
        osmNodeIds: [nodeId],
      },
      geometry: { type: "Point", coordinates: stop.coordinates },
    });
  }

  if (routes.size === 0 || stops.size === 0) {
    throw new Error("The OSM response contained no MTR Light Rail routes or stops.");
  }

  return {
    type: "FeatureCollection",
    name: "MTR Light Rail routes and stops",
    license: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    source: "https://www.openstreetmap.org/copyright",
    extractedAt: osm.osm3s?.timestamp_osm_base ?? null,
    extractionQuery: query,
    features,
  };
}

async function main() {
  const [inputPath] = process.argv.slice(2);
  const osm = inputPath
    ? JSON.parse(await readFile(resolve(inputPath), "utf8"))
    : await fetchOsmData();
  const geoJson = buildLightRailGeoJson(osm);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(geoJson)}\n`, "utf8");

  const routeCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "route",
  ).length;
  const stopCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "stop",
  ).length;
  console.log(`Wrote ${routeCount} routes and ${stopCount} stops to ${outputPath}`);
  console.log(`OSM snapshot timestamp: ${geoJson.extractedAt}; license: ${geoJson.license}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error("Failed to refresh MTR Light Rail data:", error);
    process.exitCode = 1;
  });
}

export { buildLightRailGeoJson };
