import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGeoJson,
  missingStationCodes,
  normalizeOfficialStationCode,
} from "./refresh-mtr-osm-data.mjs";

test("normalizes the Sung Wong Toi code for comparison only", () => {
  const officialCsv = [
    {
      "Line Code": "TML",
      Direction: "UT",
      "Station Code": "SUW",
      "English Name": "Sung Wong Toi",
      Sequence: "1",
    },
  ];
  const osm = {
    osm3s: { timestamp_osm_base: "2026-10-05T00:00:00Z" },
    elements: [
      {
        type: "node",
        id: 10,
        lat: 22.326,
        lon: 114.191,
        tags: { ref: "SWT", "name:en": "Sung Wong Toi" },
      },
      {
        type: "relation",
        id: 20,
        tags: { ref: "TML", "name:en": "Tuen Ma Line", colour: "#7734aa" },
        members: [
          { type: "node", ref: 10, role: "stop" },
          {
            type: "way",
            ref: 30,
            geometry: [
              { lon: 114.19, lat: 22.325 },
              { lon: 114.192, lat: 22.327 },
            ],
          },
        ],
      },
    ],
  };

  assert.equal(normalizeOfficialStationCode("SWT"), "SUW");
  assert.deepEqual(missingStationCodes(osm, officialCsv), []);

  const { geoJson, stationValidation } = buildGeoJson(osm, officialCsv, {
    elements: [],
  });
  const station = geoJson.features.find(
    ({ properties }) => properties.kind === "station",
  );
  const comparison = stationValidation.stationSequenceComparison.TML;

  assert.equal(station.properties.stationCode, "SWT");
  assert.equal(station.properties.name, "Sung Wong Toi");
  assert.deepEqual(comparison.missingFromRouteStops, []);
  assert.deepEqual(comparison.notInOfficialCsv, []);
  assert.equal(comparison.relationSequenceComparison.exactOrderMatches, 1);
});
