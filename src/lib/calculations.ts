import type { EnergyData, CostBreakdown, UsageConfig, FullCostReport } from './types';
import {
  TAURON_G11_RATE,
  TAURON_G12_RATE_PEAK,
  TAURON_G12_RATE_OFFPEAK,
  STANDBY_POWER_W,
} from './constants';

const CO2_PER_KWH = 0.71; // kg CO2 per kWh (Poland average)
const CO2_PER_TREE = 22;   // kg CO2 absorbed per tree per year

export const DEFAULT_CONFIG: UsageConfig = {
  weeklyUses: 4,
  hoursPerDay: 24,
  daysPerWeek: 7,
  nightUsagePercent: 60,
  standbyEnabled: true,
};

export function calcAnnualKwh(data: EnergyData, config: UsageConfig): number {
  if (!data.is_per_cycle) {
    // Continuous device — consumption_annual is for 24/7 use, scale by actual hours
    const baseAnnual = data.consumption_annual ?? 0;
    if (config.hoursPerDay >= 24 && config.daysPerWeek >= 7) return baseAnnual;
    const fraction = (config.hoursPerDay / 24) * (config.daysPerWeek / 7);
    return baseAnnual * fraction;
  }
  if (data.consumption_per_cycle_kwh) {
    return data.consumption_per_cycle_kwh * config.weeklyUses * 52;
  }
  if (data.consumption_per_100_cycles) {
    return (data.consumption_per_100_cycles / 100) * config.weeklyUses * 52;
  }
  return 0;
}

export function calcCostBreakdown(annualKwh: number, rate: number): CostBreakdown {
  const annual = annualKwh * rate;
  return { daily: annual / 365, weekly: annual / 52, monthly: annual / 12, annual };
}

export function calcG12CustomCost(annualKwh: number, nightPercent: number): CostBreakdown {
  const nightShare = nightPercent / 100;
  const offpeakKwh = annualKwh * nightShare;
  const peakKwh = annualKwh * (1 - nightShare);
  const annual = offpeakKwh * TAURON_G12_RATE_OFFPEAK + peakKwh * TAURON_G12_RATE_PEAK;
  return { daily: annual / 365, weekly: annual / 52, monthly: annual / 12, annual };
}

export function calcG12NightOnlyCost(annualKwh: number): CostBreakdown {
  const annual = annualKwh * TAURON_G12_RATE_OFFPEAK;
  return { daily: annual / 365, weekly: annual / 52, monthly: annual / 12, annual };
}

export function calcStandbyCost(deviceType: string): { annualKwh: number; annualCost: number } {
  const key = deviceType.toLowerCase();
  const watts = Object.entries(STANDBY_POWER_W).find(([k]) => key.includes(k))?.[1] ?? 1;
  const annualKwh = (watts * 24 * 365) / 1000;
  return { annualKwh, annualCost: annualKwh * TAURON_G11_RATE };
}

export function generateFullReport(data: EnergyData, config: UsageConfig): FullCostReport {
  const annualKwh = calcAnnualKwh(data, config);
  const g11 = calcCostBreakdown(annualKwh, TAURON_G11_RATE);
  const g12Blended = calcG12CustomCost(annualKwh, 60);
  const g12Night = calcG12NightOnlyCost(annualKwh);
  const g12Custom = calcG12CustomCost(annualKwh, config.nightUsagePercent);
  const standby = calcStandbyCost(data.device_type);

  const savingsG12Blended = g11.annual - g12Blended.annual;
  const savingsG12Night = g11.annual - g12Night.annual;
  const savingsG12Custom = g11.annual - g12Custom.annual;
  const savingsStandbyOff = config.standbyEnabled ? standby.annualCost : 0;

  // Seasonal monthly breakdown (more in winter for some devices)
  const seasonalWeights = [1.15, 1.1, 1.0, 0.9, 0.85, 0.8, 0.8, 0.85, 0.9, 1.0, 1.1, 1.15];
  const totalWeight = seasonalWeights.reduce((a, b) => a + b, 0);
  const monthlyBreakdownG11 = seasonalWeights.map(w => (g11.annual * w) / totalWeight);

  return {
    annualKwh,
    g11,
    g12Blended,
    g12Night,
    g12Custom,
    standby,
    savingsG12Blended,
    savingsG12Night,
    savingsG12Custom,
    savingsStandbyOff,
    totalPotentialSavings: savingsG12Night + savingsStandbyOff,
    co2Annual: annualKwh * CO2_PER_KWH,
    equivalentTrees: Math.ceil((annualKwh * CO2_PER_KWH) / CO2_PER_TREE),
    costPer10Years: g11.annual * 10 * 1.03, // ~3% annual price increase
    monthlyBreakdownG11,
  };
}

export function formatPln(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

export function getEfficiencyRating(energyClass: string): { label: string; description: string; color: string } {
  const ratings: Record<string, { label: string; description: string; color: string }> = {
    'A+++': { label: 'Doskonała', description: 'Najwyższa klasa efektywności', color: 'text-emerald-500' },
    'A++': { label: 'Bardzo wysoka', description: 'Wybitna efektywność energetyczna', color: 'text-emerald-500' },
    'A+': { label: 'Wysoka', description: 'Powyżej średniej efektywności', color: 'text-green-500' },
    'A': { label: 'Dobra', description: 'Najlepsza nowa klasa EU', color: 'text-green-600' },
    'B': { label: 'Powyżej średniej', description: 'Dobra efektywność', color: 'text-lime-500' },
    'C': { label: 'Średnia', description: 'Przeciętne zużycie energii', color: 'text-yellow-500' },
    'D': { label: 'Poniżej średniej', description: 'Podwyższone zużycie', color: 'text-amber-500' },
    'E': { label: 'Niska', description: 'Wysokie zużycie energii', color: 'text-orange-500' },
    'F': { label: 'Bardzo niska', description: 'Bardzo wysokie zużycie', color: 'text-orange-600' },
    'G': { label: 'Najniższa', description: 'Najwyższe zużycie energii', color: 'text-red-600' },
  };
  return ratings[energyClass] ?? { label: 'Nieznana', description: '', color: 'text-muted-foreground' };
}

export function generateTips(data: EnergyData, report: FullCostReport): string[] {
  const tips: string[] = [];

  if (data.is_per_cycle) {
    tips.push(`Zmniejszając użycie o 1× tygodniowo, zaoszczędzisz ~${formatPln(report.g11.annual / (data.is_per_cycle ? 52 : 1) * TAURON_G11_RATE)} zł rocznie.`);
    tips.push('Używaj trybu ECO — zużywa nawet 30-50% mniej energii niż program standardowy.');
    tips.push('Pełne załadowanie urządzenia to klucz — 2 połówkowe cykle zużywają więcej niż 1 pełny.');
  }

  if (report.savingsG12Night > 5) {
    tips.push(`Przejście na taryfę G12 i uruchamianie po 22:00 zaoszczędzi ${formatPln(report.savingsG12Night)} zł/rok.`);
  }

  if (report.standby.annualCost > 1) {
    tips.push(`Odłączanie z gniazdka (zamiast standby) oszczędza ${formatPln(report.standby.annualCost)} zł/rok na urządzeniu.`);
  }

  tips.push(`To urządzenie emituje ${report.co2Annual.toFixed(1)} kg CO₂ rocznie — odpowiednik ${report.equivalentTrees} drzew.`);
  tips.push(`W ciągu 10 lat koszt energii tego urządzenia to ok. ${formatPln(report.costPer10Years)} zł.`);
  tips.push('Rozważ wymianę na urządzenie klasy A — różnica kosztów zwraca się w 3-5 lat.');
  tips.push('Timer programowalny (15-30 zł) pozwala automatycznie uruchamiać urządzenia w taniej taryfie nocnej.');
  tips.push('Listwa zasilająca z wyłącznikiem eliminuje standby wielu urządzeń jednocześnie.');

  return tips;
}
