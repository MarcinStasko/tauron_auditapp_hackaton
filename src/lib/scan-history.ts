import type { EnergyData } from './types';

export interface ScanHistoryEntry {
  id: string;
  data: EnergyData;
  scannedAt: string; // ISO string
}

const STORAGE_KEY = 'tauron-scan-history';
const MAX_ENTRIES = 20;

export function getHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(data: EnergyData): ScanHistoryEntry {
  const entry: ScanHistoryEntry = {
    id: crypto.randomUUID(),
    data,
    scannedAt: new Date().toISOString(),
  };
  const history = [entry, ...getHistory()].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return entry;
}

export function removeFromHistory(id: string): void {
  const history = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
