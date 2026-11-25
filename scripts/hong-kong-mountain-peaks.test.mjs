import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const data = JSON.parse(
  await readFile(new URL("../public/data/hong-kong-mountain-peaks.geojson", import.meta.url), "utf8"),
);

test("mountain snapshot records provenance and strictly exceeds 500 metres", () => {
  assert.equal(data.type, "FeatureCollection");
  assert.equal(data.license, "ODbL-1.0");
  assert.match(data.extractedAt, /^\d{4}-\d\d-\d\dT/);
  assert.match(data.scope, /incomplete/i);
  assert.ok(Number.isInteger(data.missingElevation));
  assert.ok(Number.isInteger(data.unusableElevation));
  const ids = new Set();
  for (const feature of data.features) {
    assert.equal(feature.type, "Feature");
    assert.equal(feature.geometry.type, "Point");
    const [lon, lat] = feature.geometry.coordinates;
    assert.ok(lon >= 113.7 && lon <= 114.5 && lat >= 22.1 && lat <= 22.6);
    assert.ok(Number.isFinite(feature.properties.elevationMetres));
    assert.ok(feature.properties.elevationMetres > 500);
    assert.ok(!ids.has(feature.properties.osmNodeId));
    ids.add(feature.properties.osmNodeId);
  }
  assert.ok(data.features.some((feature) =>
    feature.properties.name === "Tai Mo Shan" && feature.properties.elevationMetres === 957));
});
