import assert from "node:assert/strict";
import test from "node:test";
import { buildLightRailGeoJson } from "./refresh-mtr-light-rail-data.mjs";

test("groups directional relations, deduplicates ways, and preserves stop routes", () => {
  const geometry = [
    { lon: 114, lat: 22.4 },
    { lon: 114.001, lat: 22.401 },
  ];
  const osm = {
    osm3s: { timestamp_osm_base: "2026-10-07T06:11:51Z" },
    elements: [
      {
        type: "node",
        id: 1,
        lat: 22.4,
        lon: 114,
        tags: { "name:en": "Siu Hong" },
      },
      {
        type: "node",
        id: 2,
        lat: 22.401,
        lon: 114.001,
      },
      { type: "way", id: 10, geometry },
      {
        type: "relation",
        id: 20,
        tags: {
          route: "light_rail",
          ref: "505",
          network: "MTR Light Rail",
          "name:en": "Light Rail 505: Siu Hong to Sam Shing",
        },
        members: [
          { type: "way", ref: 10, geometry },
          { type: "node", ref: 1, role: "stop" },
          { type: "node", ref: 2, role: "platform" },
        ],
      },
      {
        type: "relation",
        id: 21,
        tags: {
          route: "light_rail",
          ref: "505",
          network: "MTR Light Rail",
          "name:en": "Light Rail 505: Sam Shing to Siu Hong",
        },
        members: [
          { type: "way", ref: 10, geometry },
          { type: "node", ref: 2, role: "stop_entry_only" },
          { type: "node", ref: 1, role: "stop_exit_only" },
        ],
      },
      {
        type: "relation",
        id: 22,
        tags: { route: "light_rail", ref: "APM", network: "Airport People Mover" },
        members: [],
      },
      {
        type: "relation",
        id: 23,
        tags: { route: "train", ref: "505", network: "MTR Light Rail" },
        members: [],
      },
    ],
  };

  const result = buildLightRailGeoJson(osm);
  const routes = result.features.filter(
    ({ properties }) => properties.kind === "route",
  );
  const stops = result.features.filter(
    ({ properties }) => properties.kind === "stop",
  );

  assert.equal(result.license, "ODbL-1.0");
  assert.equal(result.extractedAt, "2026-10-07T06:11:51Z");
  assert.equal(routes.length, 1);
  assert.equal(routes[0].properties.routeCode, "505");
  assert.deepEqual(routes[0].properties.osmRelationIds, [20, 21]);
  assert.deepEqual(routes[0].properties.serviceNames, [
    "Light Rail 505: Sam Shing to Siu Hong",
    "Light Rail 505: Siu Hong to Sam Shing",
  ]);
  assert.equal(routes[0].properties.osmWayCount, 1);
  assert.equal(stops.length, 2);
  assert.equal(
    stops.find(({ properties }) => properties.name === "Siu Hong").properties.routeCodes[0],
    "505",
  );
  assert.equal(
    stops.find(({ properties }) => properties.name === "Light Rail stop").properties.osmNodeIds[0],
    2,
  );
});
