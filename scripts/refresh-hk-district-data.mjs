import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const bounds = "22.1,113.7,22.6,114.5";
const districtNames = [
  "Central and Western District",
  "Eastern District",
  "Islands District",
  "Kowloon City District",
  "Kwai Tsing District",
  "Kwun Tong District",
  "North District",
  "Sai Kung District",
  "Sha Tin District",
  "Sham Shui Po District",
  "Southern District",
  "Tai Po District",
  "Tsuen Wan District",
  "Tuen Mun District",
  "Wan Chai District",
  "Wong Tai Sin District",
  "Yau Tsim Mong District",
  "Yuen Long District",
];
const districtNamePattern = districtNames.join("|");
const query = `[out:json][timeout:90];relation[boundary=administrative][admin_level=6]["name:en"~"^(${districtNamePattern})$"](${bounds});out center geom;`;
const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
const outputPath = resolve("public/data/hong-kong-districts.geojson");

async function fetchOsmData() {
  const response = await fetch(overpassUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "HideAndSeekGameSite Hong Kong district data refresh",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Unable to download Hong Kong district boundaries: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

function coordinateKey(position) {
  return `${position[0]},${position[1]}`;
}

function signedArea(ring) {
  return ring.reduce((area, point, index) => {
    const next = ring[(index + 1) % ring.length];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0) / 2;
}

function normalizeRingDirection(ring, isOuter) {
  const isCounterClockwise = signedArea(ring) > 0;
  return isCounterClockwise === isOuter ? ring : [...ring].reverse();
}

function pointInRing(point, ring) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [x, y] = point;
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

function stitchRings(members, relationId, role) {
  const pending = members
    .filter(
      (member) =>
        member.type === "way" &&
        member.role === role &&
        Array.isArray(member.geometry) &&
        member.geometry.length >= 2,
    )
    .map((member) =>
      member.geometry.map(({ lon, lat }) => {
        if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
          throw new Error(`Relation ${relationId} has invalid ${role} geometry.`);
        }
        return [lon, lat];
      }),
    );
  const rings = [];

  while (pending.length > 0) {
    const ring = pending.shift();

    while (coordinateKey(ring[0]) !== coordinateKey(ring.at(-1))) {
      const endpoint = ring.at(-1);
      const matchIndex = pending.findIndex(
        (candidate) =>
          coordinateKey(candidate[0]) === coordinateKey(endpoint) ||
          coordinateKey(candidate.at(-1)) === coordinateKey(endpoint),
      );

      if (matchIndex === -1) {
        throw new Error(`Relation ${relationId} has an incomplete ${role} ring.`);
      }

      const [next] = pending.splice(matchIndex, 1);
      if (coordinateKey(next.at(-1)) === coordinateKey(endpoint)) {
        next.reverse();
      }
      ring.push(...next.slice(1));
    }

    if (ring.length < 4) {
      throw new Error(`Relation ${relationId} has an invalid ${role} ring.`);
    }
    rings.push(ring);
  }

  return rings;
}

function getDistrictGeometry(relation) {
  const outerRings = stitchRings(relation.members ?? [], relation.id, "outer");
  const innerRings = stitchRings(relation.members ?? [], relation.id, "inner");
  if (outerRings.length === 0) {
    throw new Error(`Relation ${relation.id} has no outer boundary.`);
  }

  const polygons = outerRings.map((outer) => [
    normalizeRingDirection(outer, true),
  ]);
  for (const inner of innerRings) {
    const polygon = polygons.find((candidate) =>
      pointInRing(inner[0], candidate[0]),
    );
    if (!polygon) {
      throw new Error(`Relation ${relation.id} has an uncontained inner ring.`);
    }
    polygon.push(normalizeRingDirection(inner, false));
  }

  return { type: "MultiPolygon", coordinates: polygons };
}

function buildDistrictGeoJson(osm) {
  const relations = (Array.isArray(osm.elements) ? osm.elements : []).filter(
    (element) =>
      element.type === "relation" &&
      element.tags?.boundary === "administrative" &&
      element.tags?.admin_level === "6" &&
      districtNames.includes(element.tags?.["name:en"]),
  );
  const byName = new Map(relations.map((relation) => [relation.tags["name:en"], relation]));
  const missingDistricts = districtNames.filter((name) => !byName.has(name));
  if (missingDistricts.length > 0 || relations.length !== districtNames.length) {
    throw new Error(
      `Expected all 18 Hong Kong districts; missing: ${missingDistricts.join(", ") || "duplicate district names"}.`,
    );
  }

  const features = districtNames.map((name) => {
    const relation = byName.get(name);
    const center = relation.center;
    if (!Number.isFinite(center?.lon) || !Number.isFinite(center?.lat)) {
      throw new Error(`District ${name} is missing a valid label center.`);
    }

    return {
      type: "Feature",
      properties: {
        name,
        nameZh: relation.tags["name:zh"] ?? null,
        osmRelationId: relation.id,
        center: [center.lon, center.lat],
      },
      geometry: getDistrictGeometry(relation),
    };
  });

  return {
    type: "FeatureCollection",
    name: "Hong Kong 18 district boundaries",
    license: "ODbL-1.0",
    attribution: "© OpenStreetMap contributors",
    source: "https://www.openstreetmap.org/copyright",
    extractedAt: osm.osm3s?.timestamp_osm_base ?? null,
    labelCenterExtractedAt:
      osm.labelCenterTimestamp ?? osm.osm3s?.timestamp_osm_base ?? null,
    extractionQuery: query,
    features,
  };
}

async function main() {
  const [inputPath] = process.argv.slice(2);
  const osm = inputPath
    ? JSON.parse(await readFile(resolve(inputPath), "utf8"))
    : await fetchOsmData();
  const geoJson = buildDistrictGeoJson(osm);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(geoJson)}\n`, "utf8");
  console.log(
    `Wrote ${geoJson.features.length} Hong Kong district boundaries to ${outputPath}`,
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
    console.error("Failed to refresh Hong Kong district data:", error);
    process.exitCode = 1;
  });
}

export { buildDistrictGeoJson, districtNames };
