import assert from "node:assert/strict";
import test from "node:test";
import {
  formatRadarDistance,
  MAX_RADAR_DISTANCE_METERS,
  MIN_RADAR_DISTANCE_METERS,
  parseRadarDistanceMeters,
} from "../src/lib/radar-questions.mjs";

test("custom Radar distances accept integer meters within the allowed range", () => {
  assert.equal(parseRadarDistanceMeters("1"), MIN_RADAR_DISTANCE_METERS);
  assert.equal(parseRadarDistanceMeters("150000"), MAX_RADAR_DISTANCE_METERS);
  assert.equal(parseRadarDistanceMeters("1500"), 1500);
});

test("custom Radar distances reject missing, fractional, and out-of-range values", () => {
  assert.equal(parseRadarDistanceMeters(""), null);
  assert.equal(parseRadarDistanceMeters("1.5"), null);
  assert.equal(parseRadarDistanceMeters("0"), null);
  assert.equal(parseRadarDistanceMeters("150001"), null);
  assert.equal(parseRadarDistanceMeters("not a number"), null);
});

test("Radar distances display in meters or kilometers", () => {
  assert.equal(formatRadarDistance(400), "400 m");
  assert.equal(formatRadarDistance(1500), "1.5 km");
  assert.equal(formatRadarDistance(150000), "150 km");
});
