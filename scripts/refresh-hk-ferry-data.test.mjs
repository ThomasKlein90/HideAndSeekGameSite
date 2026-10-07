import assert from "node:assert/strict";
import test from "node:test";
import { buildFerryGeoJson } from "./refresh-hk-ferry-data.mjs";

test("groups local reciprocal routes and excludes cross-border ferries", () => {
  const coordinates = [
    { lon: 114.16, lat: 22.29 },
    { lon: 114.17, lat: 22.3 },
  ];
  const osm = {
    osm3s: { timestamp_osm_base: "2026-10-07T07:05:18Z" },
    elements: [
      {
        type: "node",
        id: 1,
        lat: 22.29,
        lon: 114.16,
        tags: {
          amenity: "ferry_terminal",
          "name:en": "Central Pier",
          public_transport: "station",
        },
      },
      {
        type: "node",
        id: 2,
        lat: 22.3,
        lon: 114.17,
        tags: {
          amenity: "ferry_terminal",
          "name:en": "Peng Chau Pier",
          public_transport: "station",
        },
      },
      {
        type: "node",
        id: 3,
        lat: 22.2,
        lon: 113.6,
        tags: {
          amenity: "ferry_terminal",
          "name:en": "Macau Ferry Terminal",
          public_transport: "station",
        },
      },
      {
        type: "relation",
        id: 50,
        center: { lat: 22.2935, lon: 114.1685 },
        tags: {
          amenity: "ferry_terminal",
          "name:en": "Tsim Sha Tsui Star Ferry Pier",
        },
      },
      {
        type: "way",
        id: 51,
        center: { lat: 22.2864, lon: 114.1595 },
        tags: {
          amenity: "ferry_terminal",
          "name:en": "Central Piers",
        },
      },
      { type: "way", id: 10, geometry: coordinates },
      {
        type: "relation",
        id: 20,
        tags: {
          route: "ferry",
          ref: "Central - Peng Chau",
          "name:en": "Central to Peng Chau",
          operator: "Hong Kong & Kowloon Ferry Limited",
        },
        members: [
          { type: "node", ref: 1, role: "stop_1" },
          { type: "node", ref: 2, role: "stop_2" },
          { type: "way", ref: 10, role: "" },
        ],
      },
      {
        type: "relation",
        id: 21,
        tags: {
          route: "ferry",
          ref: "Central - Peng Chau",
          "name:en": "Peng Chau to Central",
          operator: "Hong Kong & Kowloon Ferry Limited",
        },
        members: [
          { type: "node", ref: 2, role: "stop_1" },
          { type: "node", ref: 1, role: "stop_2" },
          { type: "way", ref: 10, role: "" },
        ],
      },
      {
        type: "relation",
        id: 22,
        tags: {
          route: "ferry",
          ref: "Central - Macau",
          "name:en": "Hong Kong to Macau",
          from: "Central",
          to: "Macau",
        },
        members: [
          { type: "node", ref: 1, role: "station" },
          { type: "node", ref: 3, role: "station" },
          { type: "way", ref: 10, role: "" },
        ],
      },
    ],
  };

  const result = buildFerryGeoJson(osm);
  const routes = result.features.filter(
    ({ properties }) => properties.kind === "route",
  );
  const terminals = result.features.filter(
    ({ properties }) => properties.kind === "terminal",
  );

  assert.equal(result.license, "ODbL-1.0");
  assert.equal(result.extractedAt, "2026-10-07T07:05:18Z");
  assert.equal(routes.length, 1);
  assert.deepEqual(routes[0].properties.osmRelationIds, [20, 21]);
  assert.equal(routes[0].properties.osmWayCount, 1);
  assert.deepEqual(
    routes[0].properties.serviceNames,
    ["Central to Peng Chau", "Peng Chau to Central"],
  );
  assert.equal(terminals.length, 4);
  assert.ok(
    terminals.every(
      ({ properties }) => properties.name !== "Macau Ferry Terminal",
    ),
  );
  const starFerryPier = terminals.find(
    ({ properties }) => properties.name === "Tsim Sha Tsui Star Ferry Pier",
  );
  assert.deepEqual(starFerryPier.geometry.coordinates, [114.1685, 22.2935]);
  assert.deepEqual(starFerryPier.properties.osmElementIds, ["relation/50"]);
  const centralPiers = terminals.find(
    ({ properties }) => properties.name === "Central Piers",
  );
  assert.deepEqual(centralPiers.geometry.coordinates, [114.1595, 22.2864]);
  assert.deepEqual(centralPiers.properties.osmElementIds, ["way/51"]);
});
