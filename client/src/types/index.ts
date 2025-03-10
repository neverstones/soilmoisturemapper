export interface RangeSelectItem {
  label: string;
  value: string;
}

export interface GeoJSONFeature {
  type: string;
  properties: {
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][][];
  };
}

export interface GeoJSONCollection {
  type: string;
  features: GeoJSONFeature[];
}

export interface ChartDataPoint {
  name: string;
  [region: string]: string | number;
}

export interface MapLayerConfig {
  id: string;
  name: string;
  active: boolean;
  opacity: number;
}

export interface SoilMoistureAnalysisResult {
  region: string;
  value: number;
  average: number;
  status: string;
  geojson?: GeoJSONFeature;
}

export interface SoilMoistureTrendDataPoint {
  date: string;
  regions: {
    [region: string]: number;
  };
}
