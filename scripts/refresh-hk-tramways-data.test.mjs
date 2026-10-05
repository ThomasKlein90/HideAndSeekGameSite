import assert from "node:assert/strict";
import test from "node:test";
import { buildTramGeoJson } from "./refresh-hk-tramways-data.mjs";

test("groups both directions and deduplicates route ways and tram stops", () => {
  const osm = {
    osm3s: { timestamp_osm_base: "2026-10-05T09:34:36Z" },
    elements: [
      {
        type: "node",
        id: 1,
        lat: 22.28,
        lon: 114.15,
        tags: { ref: "01E", "name:en": "North Street" },
      },
      {
        type: "node",
        id: 2,
        lat: 22.281,
        lon: 114.151,
      },
      {
        type: "way",
        id: 10,
        geometry: [
          { lon: 114.15, lat: 22.28 },
          { lon: 114.151, lat: 22.281 },
        ],
      },
      {
        type: "relation",
        id: 20,
        tags: {
          route: "tram",
          "operator:en": "Hongkong Tramways Limited",
          "official_name:en": "Causeway Bay to Whitty Street",
          colour: "#E48F47",
        },
        members: [
          { type: "way", ref: 10, geometry: [{ lon: 114.15, lat: 22.28 }, { lon: 114.151, lat: 22.281 }] },
          { type: "node", ref: 1, role: "stop" },
          { type: "node", ref: 2, role: "stop" },
        ],
      },
      {
        type: "relation",
        id: 21,
        tags: {
          route: "tram",
          "operator:en": "Hongkong Tramways Limited",
          "official_name:en": "Causeway Bay to Whitty Street",
          colour: "#E48F47",
        },
        members: [
          { type: "way", ref: 10, geometry: [{ lon: 114.15, lat: 22.28 }, { lon: 114.151, lat: 22.281 }] },
          { type: "node", ref: 2, role: "stop_entry_only" },
          { type: "node", ref: 1, role: "stop_exit_only" },
        ],
      },
      {
        type: "relation",
        id: 22,
        tags: {
          route: "tram",
          "operator:en": "Unrelated operator",
          "official_name:en": "Should be excluded",
        },
        members: [],
      },
    ],
  };

  const result = buildTramGeoJson(osm);
  const routes = result.features.filter(
    ({ properties }) => properties.kind === "route",
  );
  const stops = result.features.filter(
    ({ properties }) => properties.kind === "stop",
  );

  assert.equal(result.license, "ODbL-1.0");
  assert.equal(result.extractedAt, "2026-10-05T09:34:36Z");
  assert.equal(routes.length, 1);
  assert.deepEqual(routes[0].properties.osmRelationIds, [20, 21]);
  assert.equal(routes[0].properties.osmWayCount, 1);
  assert.equal(stops.length, 2);
  assert.equal(stops.find(({ properties }) => properties.reference === "01E").properties.name, "North Street");
  assert.equal(stops.find(({ properties }) => properties.name === "Tram stop").properties.osmNodeIds[0], 2);
});
