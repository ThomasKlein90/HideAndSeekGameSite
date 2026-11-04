export const MIN_RADAR_DISTANCE_METERS = 1;
export const MAX_RADAR_DISTANCE_METERS = 150_000;

/**
 * @param {string} input
 */
export function parseRadarDistanceMeters(input) {
  const distance = Number(input);
  if (
    !Number.isInteger(distance) ||
    distance < MIN_RADAR_DISTANCE_METERS ||
    distance > MAX_RADAR_DISTANCE_METERS
  ) {
    return null;
  }

  return distance;
}

/**
 * @param {number} distanceMeters
 */
export function formatRadarDistance(distanceMeters) {
  if (distanceMeters >= 1000) {
    const kilometers = distanceMeters / 1000;
    return `${kilometers.toLocaleString("en-HK", {
      maximumFractionDigits: 2,
    })} km`;
  }

  return `${distanceMeters.toLocaleString("en-HK")} m`;
}
