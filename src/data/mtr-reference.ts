import type {
  Feature,
  FeatureCollection,
  MultiLineString,
  MultiPolygon,
  Point,
} from "geojson";

export const HONG_KONG_DISTRICT_NAMES = [
  "Central and Western District",
  "Eastern District",
  "Islands District",
  "Kowloon City District",
  "Kwai Tsing District",
  "Kwun Tong District",
  "North District",
  "Sai Kung District",
  "Sha Tin District",
  "Sham Shui Po District",
  "Southern District",
  "Tai Po District",
  "Tsuen Wan District",
  "Tuen Mun District",
  "Wan Chai District",
  "Wong Tai Sin District",
  "Yau Tsim Mong District",
  "Yuen Long District",
] as const;

export const mtrDataSource = {
  openStreetMap: {
    name: "OpenStreetMap contributors",
    sourceUrl: "https://www.openstreetmap.org/copyright",
    license: "Open Database License (ODbL) 1.0",
    licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
  },
  officialStationList: {
    name: "MTR Lines (except Light Rail) & Stations",
    provider: "MTR Corporation Limited via DATA.GOV.HK",
    resourceUrl:
      "https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv",
    catalogUrl:
      "https://data.gov.hk/en-data/dataset/mtr-data-routes-fares-barrier-free-facilities/resource/8daba4fe-b879-4a51-8962-27b4cffdc61c",
    termsUrl: "https://data.gov.hk/en/terms-and-conditions",
    updatedAt: "2023-06-25",
    systemMapUrl:
      "https://www.mtr.com.hk/en/customer/services/system_map.html",
  },
} as const;

export type MtrRouteProperties = {
  kind: "route";
  lineCode: string;
  name: string;
  color: string;
  osmRelationIds: number[];
  osmWayCount: number;
};

export type MtrStationProperties = {
  kind: "station";
  stationCode: string;
  name: string;
  lineCodes: string[];
  osmNodeIds: number[];
};

export type MtrMapFeature =
  | Feature<MultiLineString, MtrRouteProperties>
  | Feature<Point, MtrStationProperties>;

export type MtrStationSequenceComparison = {
  officialCount: number;
  osmCount: number;
  missingFromRouteStops: string[];
  notInOfficialCsv: string[];
  relationSequenceComparison: {
    relationCount: number;
    exactOrderMatches: number;
    unmatchedRelationIds: number[];
  };
};

export type MtrMapFeatureCollection = FeatureCollection<
  MultiLineString | Point,
  MtrRouteProperties | MtrStationProperties
> & {
  license: string;
  attribution: string;
  extractedAt: string;
  supplementalStationExtraction: {
    timestamp: string | null;
    query: string | null;
  };
};

export type TramRouteProperties = {
  kind: "route";
  serviceName: string;
  name: string;
  color: string;
  osmRelationIds: number[];
  osmWayCount: number;
};

export type TramStopProperties = {
  kind: "stop";
  name: string;
  reference: string | null;
  serviceNames: string[];
  osmNodeIds: number[];
};

export type HongKongTramwaysFeatureCollection = FeatureCollection<
  MultiLineString | Point,
  TramRouteProperties | TramStopProperties
> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string;
  extractionQuery: string;
};

export type LightRailRouteProperties = {
  kind: "route";
  routeCode: string;
  name: string;
  serviceNames: string[];
  osmRelationIds: number[];
  osmWayCount: number;
};

export type LightRailStopProperties = {
  kind: "stop";
  name: string;
  reference: string | null;
  routeCodes: string[];
  osmNodeIds: number[];
};

export type MtrLightRailFeatureCollection = FeatureCollection<
  MultiLineString | Point,
  LightRailRouteProperties | LightRailStopProperties
> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string | null;
  extractionQuery: string;
};

export type FerryRouteProperties = {
  kind: "route";
  serviceKey: string;
  name: string;
  serviceNames: string[];
  operators: string[];
  osmRelationIds: number[];
  osmWayCount: number;
  terminalNodeIds: number[];
};

export type FerryTerminalProperties = {
  kind: "terminal";
  name: string;
  reference: string | null;
  serviceNames: string[];
  osmElementIds: string[];
};

export type HongKongFerryFeatureCollection = FeatureCollection<
  MultiLineString | Point,
  FerryRouteProperties | FerryTerminalProperties
> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string | null;
  extractionQuery: string;
  scope: string;
};

export type DistrictBoundaryProperties = {
  name: string;
  nameZh: string | null;
  osmRelationId: number;
  center: [number, number];
};

export type HongKongDistrictFeatureCollection = FeatureCollection<
  MultiPolygon,
  DistrictBoundaryProperties
> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string | null;
  labelCenterExtractedAt: string | null;
  extractionQuery: string;
};

export type IslandLabelProperties = {
  name: string;
  nameZh: string | null;
  osmElementId: string;
};

export type HongKongIslandLabelFeatureCollection = FeatureCollection<
  Point,
  IslandLabelProperties
> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string | null;
  extractionQuery: string;
};

export const NAMED_PLACE_CATEGORIES = [
  "airport",
  "high-speed station",
  "amusement park",
  "aquarium",
  "zoo",
  "golf",
  "museum",
  "cinema",
  "hospital",
  "library",
  "landmass",
] as const;

export type NamedPlaceCategory = (typeof NAMED_PLACE_CATEGORIES)[number];
export type NamedPlaceProperties = {
  name: string;
  osmElementId: string;
} & (
  | { category: Exclude<NamedPlaceCategory, "hospital" | "library"> }
  | { category: "hospital"; beds: number; bedBasis: string; bedSource: string }
  | {
      category: "library";
      libraryClass: "central" | "major" | "district";
      listedFloors?: number;
      areaSquareMetres?: number;
      areaBasis?: string;
      areaSource?: string;
    }
);
export type HongKongNamedPlaces = FeatureCollection<Point, NamedPlaceProperties> & {
  license: string;
  attribution: string;
  source: string;
  retrievedOn: string;
  scope: string;
};

export type HighSpeedRailProperties = {
  name: string;
  osmRelationId: number;
  osmWayIds: number[];
};
export type HongKongHighSpeedRail = FeatureCollection<MultiLineString, HighSpeedRailProperties> & {
  license: string;
  attribution: string;
  source: string;
  relationVersion: string;
  relationTimestamp: string;
  relationRetrievedOn: string;
  geometryExtractDownloadedOn: string;
  geometrySource: string;
  scope: string;
};

export type MountainPeakProperties = {
  name: string;
  elevationMetres: number;
  osmNodeId: number;
};
export type HongKongMountainPeaks = FeatureCollection<Point, MountainPeakProperties> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string;
  districtExtractedAt: string;
  scope: string;
  peakNodesInScope: number;
  missingElevation: number;
  unusableElevation: number;
};

export type ParkProperties = {
  name: string;
  parkType: "urban" | "country";
  areaHectares: number;
  osmElementId: string;
};
export type HongKongParks = FeatureCollection<Point, ParkProperties> & {
  license: string;
  attribution: string;
  source: string;
  extractedAt: string;
  districtExtractedAt: string;
  scope: string;
  duplicateAreasRemoved: number;
};

export type MtrStationValidation = {
  name: string;
  provider: string;
  source: string;
  catalogUrl: string;
  termsUrl: string;
  updatedAt: string;
  stationCodeAliases: Array<{
    osmCode: string;
    officialCode: string;
    stationName: string;
  }>;
  stationSequenceComparison: Record<string, MtrStationSequenceComparison>;
};
