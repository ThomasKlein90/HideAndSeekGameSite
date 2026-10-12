import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bounds = "22.1,113.7,22.6,114.5";
const islandNames = [
  "Ap Lei Chau",
  "Chek Lap Kok",
  "Cheung Chau",
  "Crooked Island",
  "Double Island",
  "Grass Island",
  "Hei Ling Chau",
  "High Island",
  "Hong Kong Island",
  "Kau Sai Chau",
  "Lamma Island",
  "Lantau Island",
  "Ma Wan",
  "Ma Shi Chau",
  "Peng Chau",
  "Po Toi",
  "Sharp Island",
  "Siu A Chau",
  "Tai A Chau",
  "Town Island",
  "Tsing Yi",
  "Tung Lung Chau",
  "Tung Ping Chau",
  "Yim Tin Tsai",
];
const islandNamePattern = islandNames.join("|");
const query = `[out:json][timeout:90];nwr[place=island]["name:en"~"^(${islandNamePattern})$"](${bounds});out center tags;`;
const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const outputPath = resolve("public/data/hong-kong-islands.geojson");

async function fetchOsmData() {
  const response = await fetch(overpassUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "HideAndSeekGameSite Hong Kong island label refresh",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download Hong Kong island labels: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function buildIslandLabelGeoJson(osm) {
  const elements = (Array.isArray(osm.elements) ? osm.elements : []).filter(
    (element) =>
      ["node", "way", "relation"].includes(element.type) &&
      element.tags?.place === "island" &&
      islandNames.includes(element.tags?.["name:en"]),
  );
  const byName = new Map(
    elements.map((element) => [element.tags["name:en"], element]),
  );
  const missingIslands = islandNames.filter((name) => !byName.has(name));
  if (missingIslands.length > 0 || elements.length !== islandNames.length) {
    throw new Error(
      `Expected all ${islandNames.length} named Hong Kong islands; missing: ${missingIslands.join(", ") || "duplicate island names"}.`,
    );
  }

  const features = islandNames.map((name) => {
    const island = byName.get(name);
    const lat = island.type === "node" ? island.lat : island.center?.lat;
    const lon = island.type === "node" ? island.lon : island.center?.lon;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error(`Island ${name} is missing a valid label coordinate.`);
    }

    return {
      type: "Feature",
      properties: {
        name,
        nameZh: island.tags["name:zh"] ?? null,
        osmElementId: `${island.type}/${island.id}`,
      },
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
    };
  });

  return {
    type: "FeatureCollection",
    name: "Hong Kong island labels",
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
  const geoJson = buildIslandLabelGeoJson(osm);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(geoJson)}\n`, "utf8");
  console.log(
    `Wrote ${geoJson.features.length} Hong Kong island labels to ${outputPath}`,
  );
  console.log(
    `OSM snapshot timestamp: ${geoJson.extractedAt}; license: ${geoJson.license}`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error("Failed to refresh Hong Kong island labels:", error);
    process.exitCode = 1;
  });
}

export { buildIslandLabelGeoJson, islandNames };
