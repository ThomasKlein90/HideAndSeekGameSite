import type { Feature, FeatureCollection, LineString } from "geojson";

export type MtrLine = {
  id: string;
  name: string;
  color: string;
  stations: Array<{ name: string; coordinates: [number, number] }>;
  geometry: Feature<LineString>;
};

const line = (
  id: string,
  name: string,
  color: string,
  stations: MtrLine["stations"],
): MtrLine => ({
  id,
  name,
  color,
  stations,
  geometry: {
    type: "Feature",
    properties: { id, name, color },
    geometry: {
      type: "LineString",
      coordinates: stations.map(({ coordinates }) => coordinates),
    },
  },
});

export const mtrLines: MtrLine[] = [
  line("island", "Island Line", "#007dc5", [
    { name: "Kennedy Town", coordinates: [114.1266, 22.2816] },
    { name: "Shek Tong Tsui", coordinates: [114.1357, 22.2864] },
    { name: "Sai Ying Pun", coordinates: [114.1429, 22.2863] },
    { name: "Central", coordinates: [114.158, 22.2819] },
    { name: "Admiralty", coordinates: [114.1653, 22.2783] },
    { name: "Wan Chai", coordinates: [114.1737, 22.2774] },
    { name: "Causeway Bay", coordinates: [114.1842, 22.2803] },
    { name: "North Point", coordinates: [114.1993, 22.2913] },
    { name: "Chai Wan", coordinates: [114.236, 22.2646] },
  ]),
  line("tsuen-wan", "Tsuen Wan Line", "#ed1c24", [
    { name: "Tsuen Wan", coordinates: [114.118, 22.3731] },
    { name: "Lai King", coordinates: [114.1263, 22.3483] },
    { name: "Prince Edward", coordinates: [114.1684, 22.3255] },
    { name: "Mong Kok", coordinates: [114.1694, 22.3188] },
    { name: "Yau Ma Tei", coordinates: [114.1698, 22.3132] },
    { name: "Jordan", coordinates: [114.1718, 22.3048] },
    { name: "Tsim Sha Tsui", coordinates: [114.1719, 22.2988] },
    { name: "Admiralty", coordinates: [114.1653, 22.2783] },
  ]),
  line("kwun-tong", "Kwun Tong Line", "#00a651", [
    { name: "Whampoa", coordinates: [114.1903, 22.3051] },
    { name: "Ho Man Tin", coordinates: [114.1806, 22.3096] },
    { name: "Mong Kok", coordinates: [114.1694, 22.3188] },
    { name: "Kowloon Tong", coordinates: [114.1764, 22.3364] },
    { name: "Diamond Hill", coordinates: [114.201, 22.3401] },
    { name: "Choi Hung", coordinates: [114.2098, 22.3347] },
    { name: "Kwun Tong", coordinates: [114.2242, 22.3125] },
    { name: "Tiu Keng Leng", coordinates: [114.2579, 22.3048] },
  ]),
  line("east-rail", "East Rail Line", "#5b2c83", [
    { name: "Admiralty", coordinates: [114.1653, 22.2783] },
    { name: "Exhibition Centre", coordinates: [114.1733, 22.2849] },
    { name: "Hung Hom", coordinates: [114.187, 22.3026] },
    { name: "Mong Kok East", coordinates: [114.1735, 22.3239] },
    { name: "Kowloon Tong", coordinates: [114.1764, 22.3364] },
    { name: "Sha Tin", coordinates: [114.1882, 22.3827] },
    { name: "University", coordinates: [114.2073, 22.4131] },
    { name: "Lo Wu", coordinates: [114.113, 22.528] },
  ]),
];

export const mtrRouteFeatures: FeatureCollection<LineString> = {
  type: "FeatureCollection",
  features: mtrLines.map(({ geometry }) => geometry),
};
