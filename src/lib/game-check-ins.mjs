export const CHECK_IN_FRESHNESS_MILLISECONDS = 15 * 60 * 1000;

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

/**
 * @param {unknown} value
 * @returns {Array<{ code: string, latitude: number, longitude: number, name: string }>}
 */
export function parseMtrStations(value) {
  if (
    !isRecord(value) ||
    value.type !== "FeatureCollection" ||
    !Array.isArray(value.features)
  ) {
    throw new Error("MTR station data has an invalid format.");
  }

  const stationsByCode = new Map();
  for (const feature of value.features) {
    if (!isRecord(feature) || !isRecord(feature.properties)) {
      continue;
    }
    if (feature.properties.kind !== "station") {
      continue;
    }

    const { stationCode, name } = feature.properties;
    const geometry = feature.geometry;
    if (
      typeof stationCode !== "string" ||
      typeof name !== "string" ||
      !isRecord(geometry) ||
      geometry.type !== "Point" ||
      !Array.isArray(geometry.coordinates) ||
      typeof geometry.coordinates[0] !== "number" ||
      typeof geometry.coordinates[1] !== "number" ||
      !Number.isFinite(geometry.coordinates[0]) ||
      !Number.isFinite(geometry.coordinates[1])
    ) {
      throw new Error("MTR station data contains an invalid station.");
    }

    if (stationsByCode.has(stationCode)) {
      throw new Error(`MTR station code ${stationCode} is duplicated.`);
    }

    stationsByCode.set(stationCode, {
      code: stationCode,
      name,
      longitude: geometry.coordinates[0],
      latitude: geometry.coordinates[1],
    });
  }

  const stations = [...stationsByCode.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  if (stations.length === 0) {
    throw new Error("No MTR stations were found in the station data.");
  }
  return stations;
}

/**
 * @param {{ latitude: number, longitude: number }} first
 * @param {{ latitude: number, longitude: number }} second
 */
export function distanceInMeters(first, second) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(second.latitude - first.latitude);
  const longitudeDifference = radians(second.longitude - first.longitude);
  const firstLatitude = radians(first.latitude);
  const secondLatitude = radians(second.latitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;
  const boundedHaversine = Math.min(1, Math.max(0, haversine));

  return (
    6_371_000 *
    2 *
    Math.atan2(
      Math.sqrt(boundedHaversine),
      Math.sqrt(1 - boundedHaversine),
    )
  );
}

/**
 * @param {string} checkedInAt
 * @param {number} now
 */
export function isCheckInFresh(checkedInAt, now) {
  const timestamp = new Date(checkedInAt).getTime();
  return (
    Number.isFinite(timestamp) &&
    Math.max(0, now - timestamp) < CHECK_IN_FRESHNESS_MILLISECONDS
  );
}

/**
 * @param {string} hiderCheckInAt
 * @param {string} seekerCheckInAt
 * @param {number} now
 */
export function canCompareCheckInProximity(
  hiderCheckInAt,
  seekerCheckInAt,
  now,
) {
  return (
    isCheckInFresh(hiderCheckInAt, now) &&
    isCheckInFresh(seekerCheckInAt, now)
  );
}
