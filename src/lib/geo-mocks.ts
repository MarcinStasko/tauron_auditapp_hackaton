import type { FeatureCollection } from 'geojson';

export type GridStatus = 'overloaded' | 'balanced' | 'green_excess';

export interface GridAreaProperties {
  name: string;
  gridStatus: GridStatus;
  excess_kw: number;
  transformer: string;
  prosumers: number;
  description: string;
}

// Simplified polygons around Wrocław suburbs
export const GRID_AREAS: FeatureCollection<GeoJSON.Polygon, GridAreaProperties> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Smolec-Północ',
        gridStatus: 'green_excess',
        excess_kw: 340,
        transformer: 'T-44',
        prosumers: 128,
        description: 'Strefa z dużą nadprodukcją PV — idealna do uruchomienia energochłonnych urządzeń.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [16.94, 51.09],
          [16.96, 51.09],
          [16.96, 51.105],
          [16.94, 51.105],
          [16.94, 51.09],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Smolec-Południe',
        gridStatus: 'balanced',
        excess_kw: 12,
        transformer: 'T-45',
        prosumers: 64,
        description: 'Sieć zbalansowana — zużycie odpowiada produkcji PV w okolicy.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [16.94, 51.075],
          [16.96, 51.075],
          [16.96, 51.09],
          [16.94, 51.09],
          [16.94, 51.075],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Bielany Wrocławskie',
        gridStatus: 'overloaded',
        excess_kw: -180,
        transformer: 'T-78',
        prosumers: 42,
        description: 'Transformator przeciążony — zalecane przesunięcie zużycia na godziny z nadprodukcją PV.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [16.96, 51.075],
          [16.985, 51.075],
          [16.985, 51.095],
          [16.96, 51.095],
          [16.96, 51.075],
        ]],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Krzeptów',
        gridStatus: 'green_excess',
        excess_kw: 520,
        transformer: 'T-91',
        prosumers: 210,
        description: 'Rekordowa nadprodukcja fotowoltaiki — najlepszy czas na pranie, zmywarkę i ładowanie EV.',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [16.985, 51.08],
          [17.01, 51.08],
          [17.01, 51.10],
          [16.985, 51.10],
          [16.985, 51.08],
        ]],
      },
    },
  ],
};

export const GRID_STATUS_COLORS: Record<GridStatus, string> = {
  overloaded: '#ef4444',
  balanced: '#6b7280',
  green_excess: '#22c55e',
};

export const GRID_STATUS_LABELS: Record<GridStatus, string> = {
  overloaded: 'Przeciążenie',
  balanced: 'Zbalansowany',
  green_excess: 'Nadprodukcja PV',
};

export const MAP_CENTER: [number, number] = [51.088, 16.97];
export const MAP_ZOOM = 13;
