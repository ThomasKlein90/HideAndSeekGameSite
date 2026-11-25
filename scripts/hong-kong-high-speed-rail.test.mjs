import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const data = JSON.parse(
  await readFile(new URL("../public/data/hong-kong-high-speed-rail.geojson", import.meta.url), "utf8"),
);

test("high-speed railway snapshot is sourced and fully connected", () => {
  assert.equal(data.license, "ODbL-1.0");
  assert.equal(data.source, "https://www.openstreetmap.org/api/0.6/relation/8707713");
  assert.match(data.scope, /excludes mainland continuation/);
  assert.equal(data.features.length, 1);
  const { properties, geometry } = data.features[0];
  assert.equal(properties.osmRelationId, 8707713);
  assert.equal(geometry.type, "MultiLineString");
  assert.equal(geometry.coordinates.length, properties.osmWayIds.length);
  assert.equal(new Set(properties.osmWayIds).size, properties.osmWayIds.length);
  const graph = new Map();
  for (const line of geometry.coordinates) {
    assert.ok(line.length >= 2);
    for (const [lon, lat] of line) {
      assert.ok(Number.isFinite(lon) && Number.isFinite(lat));
      assert.ok(lon >= 113.7 && lon <= 114.5 && lat >= 22.1 && lat <= 22.6);
    }
    const a = line[0].join(",");
    const b = line.at(-1).join(",");
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a).add(b);
    graph.get(b).add(a);
  }
  const visited = new Set();
  const todo = [graph.keys().next().value];
  while (todo.length) {
    const node = todo.pop();
    if (visited.has(node)) continue;
    visited.add(node);
    todo.push(...graph.get(node));
  }
  assert.equal(visited.size, graph.size);
  const endpoints = [...graph.keys()].map((key) => key.split(",").map(Number));
  assert.ok(endpoints.some(([lon, lat]) => Math.abs(lon - 114.165) < 0.003 && Math.abs(lat - 22.3037) < 0.004));
  assert.ok(endpoints.some(([lon, lat]) => lon > 114.04 && lon < 114.07 && lat > 22.50 && lat < 22.52));
});
