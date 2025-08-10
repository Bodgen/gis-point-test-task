export interface FeatureProperties {
  COLOR_HEX: string;
  ID: number;
}

export interface Feature {
  type: 'Feature';
  properties: FeatureProperties;
  geometry: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
    crs?: {
      type: string;
      properties: {
        name: string;
      };
    };
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: Feature[];
}

export interface HexagonConfig {
  fillOpacity: number;
  strokeOpacity: number;
  strokeWidth: number;
}
