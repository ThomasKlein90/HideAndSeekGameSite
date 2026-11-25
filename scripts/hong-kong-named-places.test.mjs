import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const data = JSON.parse(
  await readFile(new URL("../public/data/hong-kong-named-places.geojson", import.meta.url), "utf8"),
);

test("selected places have traceable, unique OSM points within Hong Kong", () => {
  assert.equal(data.type, "FeatureCollection");
  assert.equal(data.license, "ODbL-1.0");
  assert.match(data.attribution, /OpenStreetMap/);
  assert.match(data.retrievedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(data.scope, /Partial/);
  const ids = new Set();
  for (const feature of data.features) {
    assert.equal(feature.type, "Feature");
    assert.equal(feature.geometry.type, "Point");
    const [lon, lat] = feature.geometry.coordinates;
    assert.ok(lon >= 113.7 && lon <= 114.5 && lat >= 22.1 && lat <= 22.6);
    assert.match(feature.properties.osmElementId, /^(node|way|relation)\/\d+$/);
    assert.ok(!ids.has(feature.properties.osmElementId));
    ids.add(feature.properties.osmElementId);
  }
});

test("curated named places include the requested museums and cinema sites", () => {
  const byCategory = Object.groupBy
    ? Object.groupBy(data.features, (feature) => feature.properties.category)
    : data.features.reduce((groups, feature) => {
        (groups[feature.properties.category] ??= []).push(feature);
        return groups;
      }, {});
  assert.deepEqual(Object.keys(byCategory).sort(), [
    "airport", "amusement park", "aquarium", "cinema", "golf", "high-speed station", "hospital", "landmass", "library", "museum", "zoo",
  ]);
  assert.equal(byCategory.airport.length, 1);
  assert.equal(byCategory["high-speed station"].length, 1);
  assert.equal(byCategory["amusement park"].length, 3);
  assert.deepEqual(byCategory.aquarium.map((feature) => feature.properties.name).sort(), [
    "Cube O Discovery Park (approximate Plaza 88 location)",
    "Ocean Park Grand Aquarium",
  ]);
  assert.equal(byCategory.zoo.length, 1);
  assert.equal(byCategory.golf.length, 5);
  assert.ok(byCategory.golf.some((feature) => feature.properties.name.includes("Ruby and Diamond")));
  assert.ok(byCategory.golf.some((feature) => feature.properties.name.includes("Eden and New")));
  assert.deepEqual(byCategory.museum.map((feature) => feature.properties.name).sort(), [
    "M+ (M Plus)",
    "Hong Kong Palace Museum",
    "Hong Kong Museum of Art",
    "Hong Kong Museum of History",
    "Hong Kong Science Museum",
    "Hong Kong Space Museum",
    "Oil Street Art Space - Oi! (approximate warehouse location)",
    "Hong Kong Heritage Museum",
    "Hong Kong Railway Museum",
    "Hong Kong Museum of the War of Resistance and Coastal Defence",
    "Sam Tung Uk Museum",
    "Flagstaff House Museum of Tea Ware",
    "Hong Kong Maritime Museum",
    "Fireboat Alexander Grantham Exhibition Gallery",
    "Hong Kong Visual Arts Centre",
    "Hong Kong Film Archive",
  ].sort());
  assert.deepEqual(byCategory.cinema.map((feature) => feature.properties.name).sort(), [
    "K11 Art House", "MOVIE TOWN", "PREMIERE ELEMENTS",
    "MY CINEMA YOHO MALL (approximate mall location)",
    "GALA CINEMA Langham Place (approximate mall location)",
    "Emperor Cinemas iSQUARE", "the sky (approximate Olympian City Two location)",
    "MCL AIRSIDE Cinema (approximate mall location)",
    "Emperor Cinemas Times Square (approximate mall location)",
    "CineArt MegaBox (approximate mall location)",
    "MCL The ONE Cinema / Broadway The ONE (shared site)", "MCL Telford Cinema",
    "CineArt House JP", "B+ cinema apm (approximate mall location)",
    "MOViE MOViE Cityplaza", "MOViE MOViE Pacific Place",
    "Emperor Cinemas Plus+ Tai Wai (approximate The Wai mall location)",
    "Emperor Cinemas Plus+ THE SOUTHSIDE (approximate mall location)",
    "CineArt Hollywood (approximate mall location)",
    "CineArt Maritime Square (approximate mall location)", "Lumen Cinema",
    "Cinema City Chai Wan (approximate Winner Centre location)",
    "CineArt MOSTown (approximate mall location)",
  ].sort());
  assert.equal(byCategory.landmass[0].properties.name, "Kowloon");
});

test("selected hospitals retain qualifying capacity and source details", () => {
  const hospitals = data.features.filter((feature) => feature.properties.category === "hospital");
  assert.equal(hospitals.length, 28);
  for (const { properties } of hospitals) {
    assert.ok(properties.beds >= 500);
    assert.ok(properties.bedBasis);
    assert.match(properties.bedSource, /^https:\/\//);
  }
  const combined = hospitals.find(({ properties }) => properties.name.includes("Ruttonjee and Tang"));
  assert.match(combined.properties.bedBasis, /combined/);
  assert.match(combined.properties.name, /Ruttonjee site/);
});

test("library selections follow the documented proxy with traceable areas", () => {
  const libraries = data.features.filter((feature) => feature.properties.category === "library");
  assert.equal(libraries.length, 24);
  assert.match(data.libraryClassificationSource, /^https:\/\//);
  for (const { properties: p } of libraries) {
    assert.ok(p.libraryClass === "central" || p.libraryClass === "major" ||
      (p.libraryClass === "district" && (p.listedFloors >= 2 || p.areaSquareMetres >= 1600)));
    if (p.areaSquareMetres !== undefined) {
      assert.ok(p.areaSquareMetres > 0);
      assert.ok(p.areaBasis);
      assert.match(p.areaSource, /^https:\/\//);
    }
  }
});
