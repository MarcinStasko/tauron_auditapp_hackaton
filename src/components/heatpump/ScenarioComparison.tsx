import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { Check, Star, Flame, Sun, Layers, Sparkles, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DetailedHouseAnalysis } from './HouseAuditor';
import FinancingCalculator, { type FinanceableScenario } from './FinancingCalculator';

type Category = 'pump' | 'pv' | 'thermo' | 'hybrid';

interface Scenario {
  id: string;
  name: string;
  subtitle: string;
  badge?: string;
  cost: number;
  subsidy: number;
  annualSavings: number;
  coverage: string;        // np. "100% zapotrzebowania" lub "65% autokonsumpcji"
  performance: string;     // COP, kWh/rok itp.
  pros: string[];
  cons: string[];
  recommended?: boolean;
}

interface Props {
  analysis: DetailedHouseAnalysis;
  area: number;
  demandKw: number;
  annualGasHeatingCost: number;
  annualHeatPumpCost: number;
  annualElectricCost: number;
  recommendedKw: number;
}

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'pump', label: 'Pompy ciepła', icon: <Flame className="h-3.5 w-3.5" /> },
  { id: 'pv', label: 'Fotowoltaika', icon: <Sun className="h-3.5 w-3.5" /> },
  { id: 'thermo', label: 'Termomodernizacja', icon: <Layers className="h-3.5 w-3.5" /> },
  { id: 'hybrid', label: 'Pakiety hybrydowe', icon: <Sparkles className="h-3.5 w-3.5" /> },
];

const ENERGY_INFLATION = 0.05;

function buildPumpScenarios(demandKw: number, annualGasCost: number): Scenario[] {
  const sizes = [8, 12, 16];
  return sizes.map((kw) => {
    const cop = kw === 8 ? 4.2 : kw === 12 ? 3.8 : 3.4;
    const cost = kw * 5500 + 3000; // instalacja + montaż
    const subsidy = Math.min(cost * 0.5, kw === 16 ? 36000 : 30000);
    const coverage = Math.min(100, (kw / demandKw) * 100);
    // im wyższy COP, tym niższy koszt energii
    const annualOpEx = (demandKw * 2200 * 0.85) / cop; // kWh ciepła → kWh prądu
    const annualHpCost = annualOpEx; // przy taryfie ~0.85 zł/kWh wbudowanej
    const annualSavings = annualGasCost - annualHpCost;
    const undersized = coverage < 95;
    const oversized = kw > demandKw * 1.6;
    return {
      id: `pump-${kw}`,
      name: `Pompa ${kw} kW`,
      subtitle: `COP ${cop.toFixed(1)} · powietrze-woda`,
      badge: undersized ? 'ZA MAŁA' : oversized ? 'NADWYMIAROWA' : 'OPTYMALNA',
      cost,
      subsidy,
      annualSavings,
      coverage: `${coverage.toFixed(0)}% zapotrzebowania`,
      performance: `COP ${cop.toFixed(1)} · ${(annualOpEx).toFixed(0)} kWh/rok`,
      pros: undersized
        ? ['Niższy koszt początkowy', 'Wystarczy w ciepłe dni']
        : oversized
        ? ['Pełna rezerwa mocy', 'Komfort przy mrozach']
        : ['Idealna dla budynku', 'Najlepszy COP', 'Optymalny koszt'],
      cons: undersized
        ? ['Wymaga grzałki w mrozy', 'Krótszy żywot kompresora']
        : oversized
        ? ['Wyższy koszt instalacji', 'Częstsze cykle on/off']
        : ['Wyższy próg inwestycji vs 8 kW'],
      recommended: !undersized && !oversized,
    };
  });
}

function buildPvScenarios(area: number): Scenario[] {
  const sizes = [4, 6, 10];
  return sizes.map((kwp) => {
    const yearly = kwp * 1000; // kWh/rok
    const cost = kwp * 5200;
    const subsidy = Math.min(6000, cost * 0.2);
    const autocons = kwp <= 6 ? 0.65 : 0.55;
    const annualSavings = yearly * 0.85 * autocons + yearly * (1 - autocons) * 0.4;
    const coverage = (yearly / (area * 35)) * 100; // % rocznego prądu domowego
    return {
      id: `pv-${kwp}`,
      name: `PV ${kwp} kWp`,
      subtitle: `${yearly} kWh/rok`,
      badge: kwp === 6 ? 'ZALECANA' : kwp === 4 ? 'BUDŻETOWA' : 'MAX',
      cost,
      subsidy,
      annualSavings,
      coverage: `${Math.min(coverage, 100).toFixed(0)}% prądu domu`,
      performance: `${(autocons * 100).toFixed(0)}% autokonsumpcji`,
      pros: kwp === 4
        ? ['Niski koszt', 'Szybki montaż', 'Wystarcza dla małej rodziny']
        : kwp === 6
        ? ['Najlepszy ROI', 'Pasuje do pompy ciepła', 'Wysoka autokonsumpcja']
        : ['Maksymalna produkcja', 'Zasilanie pompy + auta', 'Nadwyżki do sieci'],
      cons: kwp === 4
        ? ['Brak nadwyżek', 'Niewystarczy dla pompy']
        : kwp === 6
        ? ['Średni koszt']
        : ['Wymaga dużego dachu', 'Niższa autokonsumpcja'],
      recommended: kwp === 6,
    };
  });
}

function buildThermoScenarios(area: number): Scenario[] {
  return [
    {
      id: 'thermo-min',
      name: 'Pakiet Minimum',
      subtitle: 'Tylko dach + uszczelnienia',
      badge: 'OSZCZĘDNY',
      cost: area * 220,
      subsidy: area * 110,
      annualSavings: area * 22,
      coverage: '~15% redukcji strat',
      performance: 'Wełna 25cm na strop',
      pros: ['Najszybszy efekt', 'Niski koszt', 'Możliwy DIY'],
      cons: ['Ściany nadal słabe', 'Mostki termiczne'],
    },
    {
      id: 'thermo-std',
      name: 'Pakiet Standard',
      subtitle: 'Ściany + dach + okna',
      badge: 'ZALECANY',
      cost: area * 580,
      subsidy: Math.min(area * 290, 53000),
      annualSavings: area * 58,
      coverage: '~50% redukcji strat',
      performance: 'Styropian 18cm + okna U≤0.9',
      pros: ['Pełna termomodernizacja', 'Maks. dotacja', 'Skok klasy energet.'],
      cons: ['Wyższy koszt', 'Czas realizacji 3-6 mies.'],
      recommended: true,
    },
    {
      id: 'thermo-prem',
      name: 'Pakiet Premium',
      subtitle: 'Standard + rekuperacja + drzwi',
      badge: 'PASYWNY',
      cost: area * 850,
      subsidy: Math.min(area * 425, 65000),
      annualSavings: area * 75,
      coverage: '~70% redukcji strat',
      performance: 'Wełna 20cm + rekuperator + ciepły montaż',
      pros: ['Najwyższy komfort', 'Klasa A osiągalna', 'Świeże powietrze'],
      cons: ['Najwyższy koszt', 'Złożona koordynacja'],
    },
  ];
}

function buildHybridScenarios(area: number, demandKw: number, annualGasCost: number): Scenario[] {
  const pumpKw = Math.max(8, Math.ceil(demandKw / 2) * 2);
  return [
    {
      id: 'hybrid-eco',
      name: 'Hybryda ECO',
      subtitle: `Pompa ${pumpKw}kW + PV 4kWp`,
      badge: 'BUDŻETOWA',
      cost: pumpKw * 5500 + 4 * 5200 + 3000,
      subsidy: 30000 + 4000,
      annualSavings: annualGasCost * 0.7 + 4 * 1000 * 0.7,
      coverage: 'Pełne grzanie + 40% prądu',
      performance: 'COP 3.8 · 4000 kWh PV/rok',
      pros: ['Niski próg inwestycji', 'Synergia PV + pompa', 'Maks. dotacja Czyste Powietrze'],
      cons: ['Brak nadwyżek PV', 'Bez termomodernizacji'],
    },
    {
      id: 'hybrid-std',
      name: 'Hybryda STANDARD',
      subtitle: `Pompa + PV 6kWp + dach`,
      badge: 'ZALECANA',
      cost: pumpKw * 5500 + 6 * 5200 + area * 220 + 3000,
      subsidy: 30000 + 5000 + area * 110,
      annualSavings: annualGasCost * 0.85 + 6 * 1000 * 0.65,
      coverage: 'Pełne grzanie + 60% prądu + dach',
      performance: 'COP 4.0 · 6000 kWh PV',
      pros: ['Najlepszy stosunek ROI', 'Skok klasy energet.', 'Pełna synergia'],
      cons: ['Średni koszt', 'Wymaga koordynacji'],
      recommended: true,
    },
    {
      id: 'hybrid-prem',
      name: 'Hybryda PREMIUM',
      subtitle: `Pompa + PV 10kWp + termo + rekup.`,
      badge: 'DOM PASYWNY',
      cost: pumpKw * 5500 + 10 * 5200 + area * 580 + 22000,
      subsidy: 36000 + 6000 + Math.min(area * 290, 53000) + 5000,
      annualSavings: annualGasCost * 0.95 + 10 * 1000 * 0.55,
      coverage: 'Niemal samowystarczalność',
      performance: 'COP 4.5 · 10000 kWh PV · klasa A',
      pros: ['Niezależność energetyczna', 'Najwyższy komfort', 'Maks. wartość nieruchomości'],
      cons: ['Najwyższy koszt początkowy', 'Długa realizacja'],
    },
  ];
}

const ScenarioComparison = ({ analysis, area, demandKw, annualGasHeatingCost, annualHeatPumpCost, annualElectricCost, recommendedKw }: Props) => {
  const [category, setCategory] = useState<Category>('pump');

  const scenarios = useMemo<Scenario[]>(() => {
    switch (category) {
      case 'pump': return buildPumpScenarios(demandKw, annualGasHeatingCost);
      case 'pv': return buildPvScenarios(area);
      case 'thermo': return buildThermoScenarios(area);
      case 'hybrid': return buildHybridScenarios(area, demandKw, annualGasHeatingCost);
    }
  }, [category, area, demandKw, annualGasHeatingCost]);

  const roiData = useMemo(() => {
    const years = 20;
    return Array.from({ length: years + 1 }, (_, i) => {
      const point: Record<string, number | string> = { year: `${i}r` };
      scenarios.forEach((s) => {
        // skumulowane oszczędności z 5% inflacją - koszt netto
        let cum = 0;
        for (let y = 1; y <= i; y++) cum += s.annualSavings * Math.pow(1 + ENERGY_INFLATION, y - 1);
        point[s.name] = Math.round(cum - (s.cost - s.subsidy));
      });
      return point;
    });
  }, [scenarios]);

  const seriesColors = ['hsl(var(--tauron))', 'hsl(142 71% 45%)', 'hsl(217 91% 60%)'];

  return (
    <div className="space-y-4">
      {/* Category switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2 transition-all',
              category === c.id
                ? 'bg-tauron text-tauron-foreground shadow-sm'
                : 'bg-muted hover:bg-muted/70 text-muted-foreground'
            )}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground w-32">Parametr</th>
              {scenarios.map((s, i) => (
                <th key={s.id} className={cn(
                  'text-left p-3 font-bold relative',
                  s.recommended && 'bg-tauron/10'
                )}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground">{s.name}</span>
                    {s.recommended && (
                      <span className="bg-tauron text-tauron-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                        <Star className="h-2.5 w-2.5 fill-current" /> TOP
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-normal text-muted-foreground mt-0.5">{s.subtitle}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Status" cells={scenarios.map((s) => (
              <span className={cn(
                'inline-block text-[9px] font-bold px-2 py-0.5 rounded-full',
                s.badge === 'OPTYMALNA' || s.badge === 'ZALECANA' || s.badge === 'ZALECANY'
                  ? 'bg-green-500/15 text-green-600'
                  : s.badge === 'BUDŻETOWA' || s.badge === 'OSZCZĘDNY'
                  ? 'bg-blue-500/15 text-blue-600'
                  : s.badge === 'MAX' || s.badge === 'PASYWNY' || s.badge === 'DOM PASYWNY'
                  ? 'bg-purple-500/15 text-purple-600'
                  : 'bg-amber-500/15 text-amber-600'
              )}>{s.badge}</span>
            ))} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="Koszt brutto" cells={scenarios.map((s) => `${s.cost.toLocaleString('pl-PL')} zł`)} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="Dotacja" cells={scenarios.map((s) => <span className="text-green-600 font-medium">−{s.subsidy.toLocaleString('pl-PL')} zł</span>)} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="Koszt netto" cells={scenarios.map((s) => <span className="text-tauron font-bold">{(s.cost - s.subsidy).toLocaleString('pl-PL')} zł</span>)} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="Oszczędności/rok" cells={scenarios.map((s) => <span className="text-green-600 font-bold">{s.annualSavings.toFixed(0)} zł</span>)} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="ROI" cells={scenarios.map((s) => `${Math.max(1, Math.ceil((s.cost - s.subsidy) / s.annualSavings))} lat`)} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="Pokrycie" cells={scenarios.map((s) => s.coverage)} highlights={scenarios.map((s) => !!s.recommended)} />
            <Row label="Parametry" cells={scenarios.map((s) => <span className="text-muted-foreground">{s.performance}</span>)} highlights={scenarios.map((s) => !!s.recommended)} />
            <tr className="border-b border-border align-top">
              <td className="p-3 font-medium text-muted-foreground">Plusy</td>
              {scenarios.map((s) => (
                <td key={s.id} className={cn('p-3', s.recommended && 'bg-tauron/5')}>
                  <ul className="space-y-1">
                    {s.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-1 text-[11px] text-foreground">
                        <Check className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
            <tr className="align-top">
              <td className="p-3 font-medium text-muted-foreground">Minusy</td>
              {scenarios.map((s) => (
                <td key={s.id} className={cn('p-3', s.recommended && 'bg-tauron/5')}>
                  <ul className="space-y-1">
                    {s.cons.map((p, i) => (
                      <li key={i} className="flex items-start gap-1 text-[11px] text-muted-foreground">
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ROI chart */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="text-sm font-bold text-foreground">Skumulowane oszczędności (20 lat)</h4>
            <p className="text-[10px] text-muted-foreground">Inflacja energii 5%/rok · linia 0 = punkt zwrotu inwestycji</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={roiData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => `${(Number(v) / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
              formatter={(v: number) => [`${v.toLocaleString('pl-PL')} zł`, '']}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
            {scenarios.map((s, i) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.name}
                stroke={seriesColors[i]}
                strokeWidth={s.recommended ? 3 : 2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Best pick summary */}
      {scenarios.find((s) => s.recommended) && (
        <div className="rounded-2xl bg-gradient-to-br from-tauron/15 via-card to-tauron/5 border-2 border-tauron/30 p-4 flex items-start gap-3">
          <div className="bg-tauron rounded-xl p-2 flex-shrink-0">
            <Star className="h-5 w-5 text-tauron-foreground fill-tauron-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-tauron uppercase tracking-wider font-bold">Rekomendacja AI</p>
            <p className="text-sm font-bold text-foreground">
              {scenarios.find((s) => s.recommended)?.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Najlepszy stosunek kosztu netto, pokrycia zapotrzebowania i ROI dla Twojego budynku
              ({area} m², {demandKw.toFixed(1)} kW zapotrzebowania, izolacja: {analysis.insulation_status}).
            </p>
          </div>
        </div>
      )}

      {/* Financing calculator */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-tauron" />
          <h4 className="text-sm font-bold text-foreground">Kalkulator finansowania</h4>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Porównaj realne miesięczne raty dla każdego scenariusza powyżej (gotówka / kredyt / leasing).
        </p>
        <FinancingCalculator
          scenarios={scenarios.map<FinanceableScenario>((s) => ({
            id: s.id,
            name: s.name,
            netCost: s.cost - s.subsidy,
            annualSavings: s.annualSavings,
            recommended: s.recommended,
          }))}
        />
      </div>
    </div>
  );
};

const Row = ({ label, cells, highlights }: { label: string; cells: React.ReactNode[]; highlights: boolean[] }) => (
  <tr className="border-b border-border">
    <td className="p-3 font-medium text-muted-foreground">{label}</td>
    {cells.map((c, i) => (
      <td key={i} className={cn('p-3 text-foreground', highlights[i] && 'bg-tauron/5')}>{c}</td>
    ))}
  </tr>
);

export default ScenarioComparison;
