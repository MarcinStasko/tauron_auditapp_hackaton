export interface EnergyData {
  device_type: string;
  energy_class: string;
  consumption_per_cycle_kwh: number | null;
  consumption_per_100_cycles: number | null;
  consumption_annual: number | null;
  is_per_cycle: boolean;
}

export interface CostBreakdown {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface UsageConfig {
  weeklyUses: number;        // cycles per week (for per-cycle devices)
  hoursPerDay: number;       // hours of active use per day (for continuous devices like fridges, TVs)
  daysPerWeek: number;       // days used per week
  nightUsagePercent: number; // % of usage shifted to off-peak (22:00-6:00)
  standbyEnabled: boolean;   // whether device stays plugged in on standby
}

export interface FullCostReport {
  annualKwh: number;
  g11: CostBreakdown;
  g12Blended: CostBreakdown;
  g12Night: CostBreakdown;
  g12Custom: CostBreakdown;
  standby: { annualKwh: number; annualCost: number };
  savingsG12Blended: number;
  savingsG12Night: number;
  savingsG12Custom: number;
  savingsStandbyOff: number;
  totalPotentialSavings: number;
  co2Annual: number;       // kg CO2
  equivalentTrees: number; // trees needed to offset
  costPer10Years: number;
  monthlyBreakdownG11: number[];
}
