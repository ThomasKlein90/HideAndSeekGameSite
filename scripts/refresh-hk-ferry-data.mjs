import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bounds = "22.15,113.75,22.57,114.45";
const query = `[out:json][timeout:90];relation[route=ferry](${bounds})->.routes;(.routes;way(r.routes);node(r.routes););out body geom;nwr[amenity=ferry_terminal](${bounds});out center tags;`;
const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const outputPath = resolve("public/data/hong-kong-ferries.geojson");
const localTerminalPattern =
  /Central|Wan Chai|Tsim Sha Tsui|North Point|Hung Hom|Kowloon|Cheung Chau|Mui Wo|Peng Chau|Discovery Bay|Park Island|Ma Liu Shui|Lai Chi Wo|Tung Ping Chau|Tap Mun|Wong Shek|Sai Kung|Kat O|Ap Chau|Sha Tau Kok|Aberdeen|Ap Lei Chau|Tai Shue Wan|Lamma|Yung Shue Wan|Sok Kwu Wan|Town Island|Chek Keng|Ko Lau Wan|Sham Chung/i;
const nonHongKongPattern =
  /Macau|Macao|Shenzhen|Zhuhai|Guangzhou|Nansha|Zhongshan|Dongguan|Humen|Shunde|Shekou|Taipa|Porto Exterior|Heshan|Gaoming/i;
const hongKongBounds = {
  south: 22.15,
  west: 113.75,
  north: 22.57,
  east: 114.45,
};

async function fetchOsmData() {
  const response = await fetch(overpassUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "HideAndSeekGameSite Hong Kong ferry data refresh",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download ferry routes and terminals: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function isInHongKongBounds(lat, lon) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= hongKongBounds.south &&
    lat <= hongKongBounds.north &&
    lon >= hongKongBounds.west &&
    lon <= hongKongBounds.east
  );
}

function isTerminalNode(node) {
  return (
    node?.tags?.amenity === "ferry_terminal" ||
    node?.tags?.public_transport === "station" ||
    node?.tags?.public_transport === "stop_position" ||
    node?.tags?.ferry === "yes"
  );
}

function isLocalFerryRelation(relation, nodes) {
  const tags = relation.tags ?? {};
  const text = [
    tags["name:en"],
    tags.name,
    tags.ref,
    tags.from,
    tags.to,
    tags.via,
  ]
    .filter(Boolean)
    .join(" ");

  if (nonHongKongPattern.test(text)) return false;

  const localStops = (relation.members ?? [])
    .filter((member) => member.type === "node")
    .map((member) => nodes.get(member.ref))
    .filter(
      (node) =>
        isTerminalNode(node) &&
        isInHongKongBounds(node.lat, node.lon),
    );

  if (localStops.length >= 2) return true;

  return (
    typeof tags.from === "string" &&
    typeof tags.to === "string" &&
    localTerminalPattern.test(tags.from) &&
    localTerminalPattern.test(tags.to)
  );
}

function normalizeEndpoint(value) {
  return value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function getElementKey(element) {
  return `${element.type}/${element.id}`;
}

function getServiceKey(relation, localStops) {
  const tags = relation.tags ?? {};
  if (tags.ref) return `ref:${normalizeEndpoint(tags.ref)}`;

  if (typeof tags.from === "string" && typeof tags.to === "string") {
    return `endpoints:${[tags.from, tags.to]
      .map(normalizeEndpoint)
      .sort()
      .join("|")}`;
  }

  if (localStops.length > 0) {
    return `stops:${localStops.map((node) => node.id).sort((a, b) => a - b).join("|")}`;
  }

  return `relation:${relation.id}`;
}

function buildFerryGeoJson(osm) {
  const elements = Array.isArray(osm.elements) ? osm.elements : [];
  const nodes = new Map(
    elements
      .filter((element) => element.type === "node")
      .map((element) => [element.id, element]),
  );
  const ways = new Map(
    elements
      .filter((element) => element.type === "way")
      .map((element) => [element.id, element]),
  );
  const services = new Map();
  const terminals = new Map();
  const addTerminal = (element, serviceName) => {
    const name =
      element.tags?.["name:en"] ??
      element.tags?.name ??
      (element.tags?.ref ? `Ferry terminal ${element.tags.ref}` : "Ferry terminal");
    const key = getElementKey(element);
    const terminal = terminals.get(key) ?? {
      name,
      reference: element.tags?.ref ?? null,
      serviceNames: new Set(),
      coordinates:
        element.type === "node"
          ? [element.lon, element.lat]
          : [element.center?.lon, element.center?.lat],
    };
    if (serviceName) terminal.serviceNames.add(serviceName);
    terminals.set(key, terminal);
  };

  for (const relation of elements.filter(
    (element) =>
      element.type === "relation" &&
      element.tags?.route === "ferry" &&
      isLocalFerryRelation(element, nodes),
  )) {
    const memberNodes = (relation.members ?? [])
      .filter((member) => member.type === "node")
      .map((member) => nodes.get(member.ref))
      .filter(
        (node) =>
          node &&
          Number.isFinite(node.lat) &&
          Number.isFinite(node.lon) &&
          isInHongKongBounds(node.lat, node.lon),
      );
    const localStops = memberNodes.filter(isTerminalNode);
    const serviceKey = getServiceKey(relation, localStops);
    const tags = relation.tags;
    const service = services.get(serviceKey) ?? {
      relationIds: new Set(),
      ways: new Map(),
      names: new Set(),
      operators: new Set(),
      terminalIds: new Set(),
    };

    service.relationIds.add(relation.id);
    if (tags["name:en"] ?? tags.name ?? tags.ref) {
      service.names.add(tags["name:en"] ?? tags.name ?? tags.ref);
    }
    if (tags.operator) service.operators.add(tags.operator);

    for (const member of relation.members ?? []) {
      if (member.type === "way") {
        const way = ways.get(member.ref);
        if (way?.geometry?.length > 1) {
          service.ways.set(
            member.ref,
            way.geometry.map(({ lon, lat }) => [lon, lat]),
          );
        }
        continue;
      }

      if (member.type !== "node") continue;
      const node = nodes.get(member.ref);
      if (
        !node ||
        !isInHongKongBounds(node.lat, node.lon) ||
        (!isTerminalNode(node) &&
          !/^(stop|platform|plarform|station)/i.test(member.role ?? ""))
      ) {
        continue;
      }

      service.terminalIds.add(node.id);
      addTerminal(
        node,
        tags["name:en"] ?? tags.name ?? tags.ref ?? `Ferry service ${relation.id}`,
      );
    }

    services.set(serviceKey, service);
  }

  for (const element of elements) {
    const lat = element.type === "node" ? element.lat : element.center?.lat;
    const lon = element.type === "node" ? element.lon : element.center?.lon;
    if (
      isTerminalNode(element) &&
      isInHongKongBounds(lat, lon) &&
      localTerminalPattern.test(
        element.tags?.["name:en"] ?? element.tags?.name ?? "",
      )
    ) {
      addTerminal(element, null);
    }
  }

  const features = [];
  for (const [serviceKey, service] of services) {
    const coordinates = [...service.ways.values()];
    if (coordinates.length === 0) continue;

    features.push({
      type: "Feature",
      properties: {
        kind: "route",
        serviceKey,
        name: [...service.names].sort().join(" / ") || "Hong Kong ferry service",
        serviceNames: [...service.names].sort(),
        operators: [...service.operators].sort(),
        osmRelationIds: [...service.relationIds].sort((a, b) => a - b),
        osmWayCount: service.ways.size,
        terminalNodeIds: [...service.terminalIds].sort((a, b) => a - b),
      },
      geometry: { type: "MultiLineString", coordinates },
    });
  }

  for (const [elementId, terminal] of terminals) {
    if (!terminal.coordinates.every(Number.isFinite)) continue;
    features.push({
      type: "Feature",
      properties: {
        kind: "terminal",
        name: terminal.name,
        reference: terminal.reference,
        serviceNames: [...terminal.serviceNames].sort(),
        osmElementIds: [elementId],
      },
      geometry: {
        type: "Point",
        coordinates: terminal.coordinates,
      },
    });
  }

  const routeCount = features.filter(
    (feature) => feature.properties.kind === "route",
  ).length;
  const terminalCount = features.filter(
    (feature) => feature.properties.kind === "terminal",
  ).length;
  if (routeCount === 0 || terminalCount === 0) {
    throw new Error("The OSM response contained no local ferry routes or terminals.");
  }

  return {
    type: "FeatureCollection",
    name: "Hong Kong local ferry routes and terminals",
    license: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    source: "https://www.openstreetmap.org/copyright",
    extractedAt: osm.osm3s?.timestamp_osm_base ?? null,
    extractionQuery: query,
    scope:
      "Local Hong Kong passenger ferry relations with mapped local terminals; cross-border ferry routes are excluded.",
    features,
  };
}

async function main() {
  const [inputPath] = process.argv.slice(2);
  const osm = inputPath
    ? JSON.parse(await readFile(resolve(inputPath), "utf8"))
    : await fetchOsmData();
  const geoJson = buildFerryGeoJson(osm);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(geoJson)}\n`, "utf8");

  const routeCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "route",
  ).length;
  const terminalCount = geoJson.features.filter(
    (feature) => feature.properties.kind === "terminal",
  ).length;
  console.log(`Wrote ${routeCount} local ferry services and ${terminalCount} terminals to ${outputPath}`);
  console.log(`OSM snapshot timestamp: ${geoJson.extractedAt}; license: ${geoJson.license}`);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error("Failed to refresh Hong Kong ferry data:", error);
    process.exitCode = 1;
  });
}

export { buildFerryGeoJson };
