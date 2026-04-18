export type InstallationType = 'house' | 'business' | 'estate' | 'transformer' | 'solar_farm';

export interface ConsumptionConfig {
  base_kw: number;
  peak_kw: number;
  ev_charger: boolean;
  heat_pump: boolean;
  ac_units: number;
}

export interface GenerationConfig {
  pv_kw: number;
  wind_kw: number;
  battery_kwh: number;
  selling_excess: boolean;
}

export type NodeStatus = 'consuming' | 'balanced' | 'producing';

export interface GraphNode {
  id: string;
  type: InstallationType;
  name: string;
  x: number;
  y: number;
  /** Geographic latitude (optional — derived when placed on Leaflet map) */
  lat?: number;
  /** Geographic longitude (optional — derived when placed on Leaflet map) */
  lng?: number;
  consumption: ConsumptionConfig;
  generation: GenerationConfig;
}

/**
 * Project node x/y canvas coordinates (0..800 / 0..560) onto geo coords
 * around a given center. Useful for seeding default network around the user.
 */
export function projectNodesAroundCenter(
  nodes: GraphNode[],
  center: { lat: number; lng: number },
  spreadKm = 2,
): GraphNode[] {
  // 1° lat ≈ 111 km. Longitude scaled by cos(lat).
  const latPerKm = 1 / 111;
  const lngPerKm = 1 / (111 * Math.cos((center.lat * Math.PI) / 180));
  return nodes.map((n) => {
    // Normalise canvas coords to [-1, 1]
    const nx = (n.x - 400) / 400; // -1 .. 1
    const ny = (n.y - 280) / 280;
    return {
      ...n,
      lat: center.lat - ny * spreadKm * latPerKm,
      lng: center.lng + nx * spreadKm * lngPerKm,
    };
  });
}

export interface GraphEdge {
  from: string;
  to: string;
  flow_kw: number;
}

export const INSTALLATION_LABELS: Record<InstallationType, string> = {
  house: 'Dom',
  business: 'Firma',
  estate: 'Osiedle',
  transformer: 'Transformator',
  solar_farm: 'Farma PV',
};

export const INSTALLATION_ICONS: Record<InstallationType, string> = {
  house: '🏠',
  business: '🏢',
  estate: '🏘️',
  transformer: '⚡',
  solar_farm: '☀️',
};

export const NODE_RADIUS: Record<InstallationType, number> = {
  house: 28,
  business: 30,
  estate: 34,
  transformer: 38,
  solar_farm: 32,
};

// --- Simulation helpers ---

/** PV output multiplier based on hour of day (0-23), bell curve peaking at noon */
export function pvMultiplier(hour: number): number {
  if (hour < 5 || hour > 21) return 0;
  return Math.max(0, Math.exp(-0.5 * Math.pow((hour - 13) / 3, 2)));
}

/** Consumption multiplier based on hour of day — morning + evening peaks */
export function consumptionMultiplier(hour: number, type: InstallationType): number {
  if (type === 'solar_farm') return 1; // constant tiny self-consumption
  if (type === 'business') {
    // business hours 8-18
    if (hour >= 8 && hour <= 18) return 0.7 + 0.3 * Math.exp(-0.5 * Math.pow((hour - 13) / 3, 2));
    return 0.2;
  }
  // residential: morning 7-9, evening 17-21
  const morning = 0.4 * Math.exp(-0.5 * Math.pow((hour - 8) / 1.5, 2));
  const evening = 0.6 * Math.exp(-0.5 * Math.pow((hour - 19) / 2, 2));
  const base = 0.25;
  return Math.min(1, base + morning + evening);
}

/** Wind multiplier — slightly random-ish but deterministic per hour */
export function windMultiplier(hour: number): number {
  return 0.3 + 0.7 * Math.abs(Math.sin(hour * 0.7 + 2));
}

export function getSimulatedConsumption(node: GraphNode, hour: number): number {
  const mult = consumptionMultiplier(hour, node.type);
  const base = node.consumption.base_kw + node.consumption.peak_kw * mult
    + (node.consumption.ev_charger ? 7 * (hour >= 22 || hour <= 6 ? 1 : 0.1) : 0)
    + (node.consumption.heat_pump ? 5 * (hour >= 6 && hour <= 22 ? 0.6 : 1) : 0)
    + node.consumption.ac_units * 2 * (hour >= 11 && hour <= 16 ? 1 : 0.2);
  return base;
}

export function getSimulatedGeneration(node: GraphNode, hour: number): number {
  return node.generation.pv_kw * pvMultiplier(hour) + node.generation.wind_kw * windMultiplier(hour);
}

export function getTotalConsumption(node: GraphNode, hour?: number): number {
  if (hour !== undefined) return getSimulatedConsumption(node, hour);
  return node.consumption.base_kw + node.consumption.peak_kw
    + (node.consumption.ev_charger ? 7 : 0)
    + (node.consumption.heat_pump ? 5 : 0)
    + node.consumption.ac_units * 2;
}

export function getTotalGeneration(node: GraphNode, hour?: number): number {
  if (hour !== undefined) return getSimulatedGeneration(node, hour);
  return node.generation.pv_kw + node.generation.wind_kw;
}

export function getNodeBalance(node: GraphNode, hour?: number): number {
  return getTotalGeneration(node, hour) - getTotalConsumption(node, hour);
}

export function getNodeStatus(node: GraphNode, hour?: number): NodeStatus {
  const balance = getNodeBalance(node, hour);
  if (balance > 1) return 'producing';
  if (balance < -1) return 'consuming';
  return 'balanced';
}

export const NODE_STATUS_COLORS: Record<NodeStatus, string> = {
  consuming: 'hsl(0, 84%, 60%)',
  balanced: 'hsl(220, 10%, 55%)',
  producing: 'hsl(142, 71%, 45%)',
};

export const DEFAULT_CONSUMPTION: ConsumptionConfig = {
  base_kw: 1, peak_kw: 2, ev_charger: false, heat_pump: false, ac_units: 0,
};

export const DEFAULT_GENERATION: GenerationConfig = {
  pv_kw: 0, wind_kw: 0, battery_kwh: 0, selling_excess: false,
};

export const DEFAULT_NODES: GraphNode[] = [
  {
    id: 'tr-1', type: 'transformer', name: 'Transformator T-301', x: 400, y: 250,
    consumption: { base_kw: 0, peak_kw: 0, ev_charger: false, heat_pump: false, ac_units: 0 },
    generation: { pv_kw: 0, wind_kw: 0, battery_kwh: 0, selling_excess: false },
  },
  {
    id: 'h-1', type: 'house', name: 'Dom Kowalskich', x: 150, y: 80,
    consumption: { base_kw: 1.2, peak_kw: 3, ev_charger: false, heat_pump: true, ac_units: 1 },
    generation: { pv_kw: 8, wind_kw: 0, battery_kwh: 10, selling_excess: true },
  },
  {
    id: 'h-2', type: 'house', name: 'Dom Nowaków', x: 650, y: 80,
    consumption: { base_kw: 1.5, peak_kw: 4, ev_charger: true, heat_pump: false, ac_units: 2 },
    generation: { pv_kw: 5, wind_kw: 0, battery_kwh: 5, selling_excess: false },
  },
  {
    id: 'b-1', type: 'business', name: 'Sklep Żabka', x: 150, y: 420,
    consumption: { base_kw: 8, peak_kw: 15, ev_charger: false, heat_pump: false, ac_units: 4 },
    generation: { pv_kw: 12, wind_kw: 0, battery_kwh: 20, selling_excess: true },
  },
  {
    id: 'e-1', type: 'estate', name: 'Osiedle Słoneczne', x: 650, y: 420,
    consumption: { base_kw: 25, peak_kw: 60, ev_charger: true, heat_pump: true, ac_units: 10 },
    generation: { pv_kw: 40, wind_kw: 5, battery_kwh: 100, selling_excess: true },
  },
  {
    id: 'sf-1', type: 'solar_farm', name: 'Farma PV Smolec', x: 400, y: 480,
    consumption: { base_kw: 0.5, peak_kw: 0, ev_charger: false, heat_pump: false, ac_units: 0 },
    generation: { pv_kw: 100, wind_kw: 0, battery_kwh: 200, selling_excess: true },
  },
];

export const DEFAULT_EDGES: GraphEdge[] = [
  { from: 'tr-1', to: 'h-1', flow_kw: 0 },
  { from: 'tr-1', to: 'h-2', flow_kw: 0 },
  { from: 'tr-1', to: 'b-1', flow_kw: 0 },
  { from: 'tr-1', to: 'e-1', flow_kw: 0 },
  { from: 'tr-1', to: 'sf-1', flow_kw: 0 },
  { from: 'h-1', to: 'h-2', flow_kw: 0 },
  { from: 'b-1', to: 'sf-1', flow_kw: 0 },
];

let _idCounter = 100;
export function generateNodeId(): string {
  return `node-${++_idCounter}`;
}
