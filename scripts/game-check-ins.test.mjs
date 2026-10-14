import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  canCompareCheckInProximity,
  CHECK_IN_FRESHNESS_MILLISECONDS,
  distanceInMeters,
  isCheckInFresh,
  parseMtrStations,
} from "../src/lib/game-check-ins.mjs";

test("a check-in is fresh for less than 15 minutes", () => {
  const now = Date.parse("2026-10-14T05:00:00.000Z");
  const freshCheckIn = new Date(
    now - CHECK_IN_FRESHNESS_MILLISECONDS + 1,
  ).toISOString();
  const staleAtThreshold = new Date(
    now - CHECK_IN_FRESHNESS_MILLISECONDS,
  ).toISOString();

  assert.equal(isCheckInFresh(freshCheckIn, now), true);
  assert.equal(isCheckInFresh(staleAtThreshold, now), false);
  assert.equal(isCheckInFresh("invalid timestamp", now), false);
  assert.equal(
    canCompareCheckInProximity(
      new Date(now - CHECK_IN_FRESHNESS_MILLISECONDS).toISOString(),
      freshCheckIn,
      now,
    ),
    false,
  );
  assert.equal(
    canCompareCheckInProximity(freshCheckIn, freshCheckIn, now),
    true,
  );
});

test("station proximity uses meter distances", () => {
  const origin = { latitude: 0, longitude: 0 };
  const withinFiveHundredMeters = { latitude: 0.004, longitude: 0 };
  const outsideFiveHundredMeters = { latitude: 0.005, longitude: 0 };

  assert.equal(distanceInMeters(origin, origin), 0);
  assert.ok(distanceInMeters(origin, withinFiveHundredMeters) < 500);
  assert.ok(distanceInMeters(origin, outsideFiveHundredMeters) > 500);
});

test("the MTR snapshot contains unique station codes and coordinates", async () => {
  const snapshot = JSON.parse(
    await readFile(
      new URL("../public/data/mtr-osm.geojson", import.meta.url),
      "utf8",
    ),
  );
  const stations = parseMtrStations(snapshot);

  assert.equal(stations.length, 98);
  assert.equal(new Set(stations.map((station) => station.code)).size, 98);
  assert.ok(
    stations.every(
      (station) =>
        Number.isFinite(station.latitude) &&
        Number.isFinite(station.longitude),
    ),
  );
});
