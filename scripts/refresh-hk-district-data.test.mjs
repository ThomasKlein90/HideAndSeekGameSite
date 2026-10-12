import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDistrictGeoJson,
  districtNames,
} from "./refresh-hk-district-data.mjs";

test("builds all 18 district polygons, stitching rings and excluding extras", () => {
  const districts = districtNames.map((name, index) => {
    const west = 114 + index * 0.01;
    const south = 22 + index * 0.01;
    const outer = [
      [west, south],
      [west + 0.008, south],
      [west + 0.008, south + 0.008],
      [west, south + 0.008],
      [west, south],
    ];
    const members = [
      {
        type: "way",
        role: "outer",
        geometry: outer.slice(0, 3).map(([lon, lat]) => ({ lon, lat })),
      },
      {
        type: "way",
        role: "outer",
        geometry: outer.slice(2).map(([lon, lat]) => ({ lon, lat })),
      },
    ];

    if (index === 0) {
      const inner = [
        [west + 0.002, south + 0.002],
        [west + 0.003, south + 0.002],
        [west + 0.003, south + 0.003],
        [west + 0.002, south + 0.003],
        [west + 0.002, south + 0.002],
      ];
      members.push({
        type: "way",
        role: "inner",
        geometry: inner.map(([lon, lat]) => ({ lon, lat })),
      });
    }

    return {
      type: "relation",
      id: index + 100,
      center: { lon: west + 0.004, lat: south + 0.004 },
      tags: {
        boundary: "administrative",
        admin_level: "6",
        "name:en": name,
        "name:zh": `District ${index + 1}`,
      },
      members,
    };
  });
  districts.push({
    type: "relation",
    id: 999,
    tags: {
      boundary: "administrative",
      admin_level: "6",
      "name:en": "Lok Ma Chau Loop",
    },
    members: [],
  });

  const result = buildDistrictGeoJson({
    osm3s: { timestamp_osm_base: "2026-10-07T09:17:22Z" },
    elements: districts,
  });

  assert.equal(result.license, "ODbL-1.0");
  assert.equal(result.extractedAt, "2026-10-07T09:17:22Z");
  assert.equal(result.labelCenterExtractedAt, "2026-10-07T09:17:22Z");
  assert.equal(result.features.length, 18);
  assert.equal(result.features[0].properties.osmRelationId, 100);
  assert.equal(result.features[0].properties.nameZh, "District 1");
  assert.equal(result.features[0].geometry.type, "MultiPolygon");
  assert.equal(result.features[0].geometry.coordinates[0].length, 2);
  assert.deepEqual(
    result.features[0].geometry.coordinates[0][0][0],
    [114, 22],
  );
  assert.equal(result.features[0].properties.center[0], 114.004);
});

test("rejects missing districts and incomplete boundary rings", () => {
  assert.throws(
    () => buildDistrictGeoJson({ elements: [] }),
    /Expected all 18 Hong Kong districts/,
  );

  const incomplete = districtNames.map((name, index) => ({
    type: "relation",
    id: index + 100,
    center: { lon: 114, lat: 22 },
    tags: {
      boundary: "administrative",
      admin_level: "6",
      "name:en": name,
    },
    members:
      index === 0
        ? [
            {
              type: "way",
              role: "outer",
              geometry: [
                { lon: 114, lat: 22 },
                { lon: 114.1, lat: 22.1 },
              ],
            },
          ]
        : [
            {
              type: "way",
              role: "outer",
              geometry: [
                { lon: 114, lat: 22 },
                { lon: 114.1, lat: 22.1 },
                { lon: 114, lat: 22 },
              ],
            },
          ],
  }));
  assert.throws(
    () => buildDistrictGeoJson({ elements: incomplete }),
    /incomplete outer ring/,
  );
});
