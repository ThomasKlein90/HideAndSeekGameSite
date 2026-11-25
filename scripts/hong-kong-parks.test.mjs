import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const data = JSON.parse(await readFile(new URL("../public/data/hong-kong-parks.geojson", import.meta.url), "utf8"));

test("park snapshot has traceable urban and country parks strictly above five hectares", () => {
  assert.equal(data.license, "ODbL-1.0");
  assert.match(data.scope, /Partial/);
  assert.match(data.extractedAt, /^\d{4}-\d\d-\d\dT/);
  const ids = new Set();
  const categories = new Set();
  for (const feature of data.features) {
    assert.equal(feature.type, "Feature");
    assert.equal(feature.geometry.type, "Point");
    const [lon, lat] = feature.geometry.coordinates;
    assert.ok(lon >= 113.7 && lon <= 114.5 && lat >= 22.1 && lat <= 22.6);
    assert.ok(Number.isFinite(feature.properties.areaHectares) && feature.properties.areaHectares > 5);
    assert.match(feature.properties.osmElementId, /^(way|relation)\/\d+$/);
    assert.ok(!ids.has(feature.properties.osmElementId));
    ids.add(feature.properties.osmElementId);
    categories.add(feature.properties.parkType);
  }
  assert.deepEqual([...categories].sort(), ["country", "urban"]);
  assert.ok(data.features.some((f) => f.properties.name === "Victoria Park" && f.properties.parkType === "urban"));
  assert.ok(data.features.some((f) => f.properties.name === "Lion Rock Country Park" && f.properties.parkType === "country"));
  assert.ok(!data.features.some((f) => f.properties.osmElementId === "way/97788544"));
});
