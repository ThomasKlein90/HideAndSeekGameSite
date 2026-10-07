import type { Feature, FeatureCollection, MultiLineString, Point } from "geojson";

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
