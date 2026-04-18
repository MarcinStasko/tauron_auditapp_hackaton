export const TAURON_G11_RATE = 1.15; // PLN per kWh - Standard
export const TAURON_G12_RATE_PEAK = 1.30; // PLN per kWh - Day
export const TAURON_G12_RATE_OFFPEAK = 0.85; // PLN per kWh - Night/Weekend

// Approximate % of usage that can be shifted to off-peak (nights/weekends)
export const G12_OFFPEAK_SHARE = 0.6; // ~60% can be shifted

export const ENERGY_CLASS_COLORS: Record<string, string> = {
  'A+++': 'bg-emerald-600',
  'A++': 'bg-emerald-500',
  'A+': 'bg-green-500',
  A: 'bg-green-600',
  B: 'bg-lime-500',
  C: 'bg-yellow-500',
  D: 'bg-amber-500',
  E: 'bg-orange-500',
  F: 'bg-orange-600',
  G: 'bg-red-600',
};

export const ENERGY_CLASS_BADGE_COLORS: Record<string, string> = {
  'A+++': 'bg-emerald-600 text-emerald-50',
  'A++': 'bg-emerald-500 text-emerald-50',
  'A+': 'bg-green-500 text-green-50',
  A: 'bg-green-600 text-green-50',
  B: 'bg-lime-500 text-lime-950',
  C: 'bg-yellow-500 text-yellow-950',
  D: 'bg-amber-500 text-amber-950',
  E: 'bg-orange-500 text-orange-50',
  F: 'bg-orange-600 text-orange-50',
  G: 'bg-red-600 text-red-50',
};

export const STANDBY_POWER_W: Record<string, number> = {
  'piekarnik': 2,
  'oven': 2,
  'pralka': 1,
  'washing machine': 1,
  'zmywarka': 1,
  'dishwasher': 1,
  'lodówka': 0,
  'fridge': 0,
  'refrigerator': 0,
  'telewizor': 0.5,
  'tv': 0.5,
  'television': 0.5,
};
