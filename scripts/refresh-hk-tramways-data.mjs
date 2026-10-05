import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bounds = "22.15,114.05,22.35,114.35";
const query = `[out:json][timeout:90];relation[route=tram]["operator:en"~"Hongkong Tramways"](${bounds})->.routes;(.routes;node(r.routes););out body geom;`;
const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const outputPath = resolve("public/data/hong-kong-tramways.geojson");

async function fetchOsmData() {
  const response = await fetch(overpassUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "HideAndSeekGameSite Hong Kong Tramways data refresh",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download tram route geometry: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function buildTramGeoJson(osm) {
  const elements = Array.isArray(osm.elements) ? osm.elements : [];
  const nodes = new Map(
    elements
      .filter((element) => element.type === "node")
      .map((element) => [element.id, element]),
  );
  const services = new Map();
  const stops = new Map();

  for (const relation of elements.filter(
    (element) =>
      element.type === "relation" &&
      element.tags?.route === "tram" &&
      /Hongkong Tramways/i.test(element.tags["operator:en"] ?? ""),
  )) {
    const { tags } = relation;
    const serviceName =
      tags["official_name:en"] ??
      tags["name:en"]?.replace(/^Hong Kong Tramways\s+/i, "") ??
      `Service ${relation.id}`;
    const service = services.get(serviceName) ?? {
      relationIds: new Set(),
      ways: new Map(),
      color: /^#[0-9a-f]{6}$/i.test(tags.colour ?? "")
        ? tags.colour
        : "#309ad0",
    };
    service.relationIds.add(relation.id);

    for (const member of relation.members ?? []) {
      if (member.type === "way" && member.geometry?.length > 1) {
        service.ways.set(
          member.ref,
          member.geometry.map(({ lon, lat }) => [lon, lat]),
        );
        continue;
      }

      if (
        member.type !== "node" ||
        !member.role?.startsWith("stop") ||
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
          (node.tags?.ref ? `Tram stop ${node.tags.ref}` : "Tram stop"),
        reference: node.tags?.ref ?? null,
        serviceNames: new Set(),
      };
      stop.serviceNames.add(serviceName);
      stops.set(node.id, {
        ...stop,
        coordinates: [node.lon, node.lat],
      });
    }

    services.set(serviceName, service);
  }

  const features = [];
  for (const [serviceName, service] of services) {
    features.push({
      type: "Feature",
      properties: {
        kind: "route",
        serviceName,
        name: `Hong Kong Tramways — ${serviceName}`,
        color: service.color,
        osmRelationIds: [...service.relationIds].sort((a, b) => a - b),
        osmWayCount: service.ways.size,
      },
      geometry: {
        type: "MultiLineString",
        coordinates: [...service.ways.values()],
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
        serviceNames: [...stop.serviceNames].sort(),
        osmNodeIds: [nodeId],
      },
      geometry: { type: "Point", coordinates: stop.coordinates },
    });
  }

  if (services.size === 0 || stops.size === 0) {
    throw new Error("The OSM response contained no Hong Kong tram routes or stops.");
  }

  return {
    type: "FeatureCollection",
    name: "Hong Kong Tramways routes and stops",
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
  const geoJson = buildTramGeoJson(osm);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(geoJson)}\n`, "utf8");

  const routeCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "route",
  ).length;
  const stopCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "stop",
  ).length;
  console.log(`Wrote ${routeCount} services and ${stopCount} stops to ${outputPath}`);
  console.log(`OSM snapshot timestamp: ${geoJson.extractedAt}; license: ${geoJson.license}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error("Failed to refresh Hong Kong Tramways data:", error);
    process.exitCode = 1;
  });
}

export { buildTramGeoJson };
