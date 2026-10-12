import assert from "node:assert/strict";
import test from "node:test";
import {
  buildIslandLabelGeoJson,
  islandNames,
} from "./refresh-hk-island-labels.mjs";

test("extracts the curated Hong Kong island labels and excludes nearby extras", () => {
  const elements = islandNames.map((name, index) => ({
    type: index % 2 === 0 ? "relation" : "node",
    id: index + 100,
    lat: 22.1 + index / 100,
    lon: 114.1 + index / 100,
    center: { lat: 22.1 + index / 100, lon: 114.1 + index / 100 },
    tags: {
      place: "island",
      "name:en": name,
      "name:zh": `Island ${index + 1}`,
    },
  }));
  elements.push(
    {
      type: "relation",
      id: 999,
      center: { lat: 22.5, lon: 114.4 },
      tags: {
        place: "island",
        "name:en": "Nei Lingding Island",
      },
    },
    {
      type: "way",
      id: 1000,
      center: { lat: 22.2, lon: 114.2 },
      tags: {
        place: "islet",
        "name:en": "Green Island",
      },
    },
  );

  const result = buildIslandLabelGeoJson({
    osm3s: { timestamp_osm_base: "2026-10-12T08:39:49Z" },
    elements,
  });

  assert.equal(result.license, "ODbL-1.0");
  assert.equal(result.extractedAt, "2026-10-12T08:39:49Z");
  assert.equal(result.features.length, 24);
  assert.equal(result.features[0].properties.name, islandNames[0]);
  assert.equal(result.features[0].properties.nameZh, "Island 1");
  assert.deepEqual(result.features[0].geometry.coordinates, [114.1, 22.1]);
  assert.equal(result.features[0].properties.osmElementId, "relation/100");
});

test("rejects missing islands and invalid label coordinates", () => {
  assert.throws(
    () => buildIslandLabelGeoJson({ elements: [] }),
    /Expected all 24 named Hong Kong islands/,
  );

  const elements = islandNames.map((name, index) => ({
    type: "node",
    id: index + 100,
    lat: 22.2,
    lon: 114.2,
    tags: { place: "island", "name:en": name },
  }));
  elements[0].lat = Number.NaN;
  assert.throws(
    () => buildIslandLabelGeoJson({ elements }),
    /Island Ap Lei Chau is missing a valid label coordinate/,
  );
});
