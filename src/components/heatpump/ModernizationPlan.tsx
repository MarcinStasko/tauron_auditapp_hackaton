import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts';
import {
  CheckCircle2, Circle, ArrowRight, TrendingDown, Zap, Flame,
  Leaf, Calendar, PiggyBank, ChevronDown, ChevronUp, Target,
  Shield, Thermometer, Sun, Home, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DetailedHouseAnalysis } from './HouseAuditor';

interface Props {
  analysis: DetailedHouseAnalysis;
  recommendedKw: number;
  installCost: number;
  subsidyAmount: number;
  annualHeatPumpCost: number;
  annualGasHeatingCost: number;
}

interface Phase {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  actions: string[];
  cost: number;
  subsidyPercent: number;
  energySavingPercent: number;
  demandReductionWm2: number;
  duration: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const PRIORITY_COLORS = {
  critical: 'bg-red-500/15 text-red-500 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  medium: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
  low: 'bg-green-500/15 text-green-500 border-green-500/30',
};
const PRIORITY_LABELS = { critical: 'Pilne', high: 'Wysoki', medium: 'Średni', low: 'Niski' };

function buildPhases(a: DetailedHouseAnalysis, pumpKw: number, pumpCost: number): Phase[] {
  const phases: Phase[] = [];
  const area = a.total_heated_area || a.estimated_sqm;
  const baseWm2 = a.heat_demand_w_per_m2 || 80;

  // Phase 1: Insulation
  if (a.wall_insulation.quality !== 'Good' || a.roof.quality !== 'Good') {
    const wallCost = a.wall_insulation.quality === 'Poor' ? area * 180 : a.wall_insulation.quality === 'Average' ? area * 120 : 0;
    const roofCost = a.roof.quality === 'Poor' ? area * 0.5 * 140 : a.roof.quality === 'Average' ? area * 0.5 * 90 : 0;
    const saving = a.wall_insulation.quality === 'Poor' ? 30 : a.wall_insulation.quality === 'Average' ? 18 : 8;
    phases.push({
      id: 'insulation',
      name: 'Termomodernizacja ścian i dachu',
      icon: <Shield className="h-5 w-5" />,
      description: 'Docieplenie ścian zewnętrznych (styropian/wełna 15-20cm) i dachu. Eliminacja mostków termicznych.',
      actions: [
        a.wall_insulation.quality !== 'Good' ? `Docieplenie ścian — ${a.wall_insulation.details}` : '',
        a.roof.quality !== 'Good' ? `Izolacja dachu — ${a.roof.material}, ${a.roof.details}` : '',
        ...a.thermal_bridges.map(b => `Likwidacja mostka: ${b}`),
        'Wykonanie audytu termowizyjnego po pracach',
      ].filter(Boolean),
      cost: wallCost + roofCost,
      subsidyPercent: 40,
      energySavingPercent: saving,
      demandReductionWm2: baseWm2 * (saving / 100),
      duration: '4-8 tygodni',
      priority: a.wall_insulation.quality === 'Poor' ? 'critical' : 'high',
    });
  }

  // Phase 2: Windows
  if (a.windows.quality !== 'Good') {
    const windowCount = Math.ceil(area / 12);
    const costPerWindow = a.windows.quality === 'Poor' ? 3200 : 2400;
    phases.push({
      id: 'windows',
      name: 'Wymiana stolarki okiennej',
      icon: <Home className="h-5 w-5" />,
      description: `Wymiana ${windowCount} okien na trzyszybowe z niskim U (≤0.9 W/m²K). Montaż z ciepłym profilem.`,
      actions: [
        `Wymiana ~${windowCount} okien: ${a.windows.type} → trzyszybowe PVC/aluminium`,
        'Montaż nawiewników higrosterowanych',
        'Uszczelnienie połączeń ościeżnic',
        a.air_tightness === 'Poor' ? 'Poprawa szczelności powietrznej budynku' : '',
      ].filter(Boolean),
      cost: windowCount * costPerWindow,
      subsidyPercent: 35,
      energySavingPercent: a.windows.quality === 'Poor' ? 20 : 12,
      demandReductionWm2: baseWm2 * (a.windows.quality === 'Poor' ? 0.20 : 0.12),
      duration: '2-4 tygodnie',
      priority: a.windows.quality === 'Poor' ? 'critical' : 'high',
    });
  }

  // Phase 3: Heat pump
  phases.push({
    id: 'heatpump',
    name: 'Instalacja pompy ciepła',
    icon: <Thermometer className="h-5 w-5" />,
    description: `Montaż pompy ciepła powietrze-woda ${pumpKw} kW z buforem c.w.u. 200-300L i sterowaniem pogodowym.`,
    actions: [
      `Pompa ciepła ${pumpKw} kW powietrze-woda (COP ~3.5)`,
      'Bufor ciepłej wody użytkowej 200-300L',
      'Sterownik pogodowy z czujnikiem zewnętrznym',
      'Dostosowanie instalacji grzewczej (ogrzewanie podłogowe / niskotemperaturowe grzejniki)',
      'Demontaż starego źródła ciepła',
    ],
    cost: pumpCost,
    subsidyPercent: 45,
    energySavingPercent: 35,
    demandReductionWm2: baseWm2 * 0.35,
    duration: '3-5 dni',
    priority: 'high',
  });

  // Phase 4: Solar PV
  if (a.solar_potential.recommended_pv_kwp > 0) {
    const pvCost = a.solar_potential.recommended_pv_kwp * 4800;
    phases.push({
      id: 'solar',
      name: 'Instalacja fotowoltaiki',
      icon: <Sun className="h-5 w-5" />,
      description: `Montaż ${a.solar_potential.recommended_pv_kwp} kWp paneli PV na dachu (${a.solar_potential.roof_orientation}, ${a.solar_potential.roof_angle_deg}°).`,
      actions: [
        `${a.solar_potential.recommended_pv_kwp} kWp paneli monokrystalicznych`,
        'Falownik hybrydowy z optymalizatorami',
        `Orientacja: ${a.solar_potential.roof_orientation}, kąt: ${a.solar_potential.roof_angle_deg}°`,
        `Powierzchnia: ${a.solar_potential.available_area_sqm} m²`,
        'Przyłączenie do sieci — net-billing',
      ],
      cost: pvCost,
      subsidyPercent: 50,
      energySavingPercent: 15,
      demandReductionWm2: 0,
      duration: '2-3 dni',
      priority: 'medium',
    });
  }

  // Phase 5: Ventilation
  if (a.air_tightness !== 'Good') {
    phases.push({
      id: 'ventilation',
      name: 'Wentylacja mechaniczna z odzyskiem ciepła',
      icon: <Zap className="h-5 w-5" />,
      description: 'Instalacja rekuperatora z odzyskiem ciepła 85-95%. Redukcja strat wentylacyjnych.',
      actions: [
        'Centrala wentylacyjna z rekuperacją (odzysk 85-95%)',
        'Rozprowadzenie kanałów wentylacyjnych',
        'Czujniki CO₂ i wilgotności',
        'By-pass letni do chłodzenia nocnego',
      ],
      cost: area * 120,
      subsidyPercent: 30,
      energySavingPercent: 12,
      demandReductionWm2: baseWm2 * 0.12,
      duration: '1-2 tygodnie',
      priority: a.air_tightness === 'Poor' ? 'high' : 'medium',
    });
  }

  return phases;
}

function generateYearlyProjection(
  phases: Phase[],
  baseAnnualCost: number,
  baseWm2: number,
  area: number,
  years: number = 20
) {
  const data: { year: number; bezModernizacji: number; poModernizacji: number; skumulowaneOszczednosci: number; zapotrzebowanie: number }[] = [];
  
  const totalSavingPercent = phases.reduce((sum, p) => sum + p.energySavingPercent, 0);
  const effectiveSaving = Math.min(totalSavingPercent, 85) / 100;
  const modernizedCost = baseAnnualCost * (1 - effectiveSaving);
  const modernizedWm2 = baseWm2 * (1 - effectiveSaving);
  const inflation = 0.05; // 5% energy inflation

  let cumSavings = 0;
  const totalInvestment = phases.reduce((s, p) => s + p.cost * (1 - p.subsidyPercent / 100), 0);

  for (let y = 0; y <= years; y++) {
    const inflationFactor = Math.pow(1 + inflation, y);
    const baseCost = baseAnnualCost * inflationFactor;
    const modCost = modernizedCost * inflationFactor;
    cumSavings += y > 0 ? (baseCost - modCost) : 0;

    data.push({
      year: y,
      bezModernizacji: Math.round(baseCost),
      poModernizacji: Math.round(modCost),
      skumulowaneOszczednosci: Math.round(cumSavings - totalInvestment),
      zapotrzebowanie: Math.round(y === 0 ? baseWm2 : modernizedWm2),
    });
  }
  return data;
}

function generateMonthlyDemand(baseWm2: number, phases: Phase[], area: number) {
  const monthlyFactors = [1.8, 1.6, 1.2, 0.7, 0.3, 0.05, 0.02, 0.05, 0.3, 0.8, 1.3, 1.7];
  const months = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
  const totalSaving = Math.min(phases.reduce((s, p) => s + p.energySavingPercent, 0), 85) / 100;

  return months.map((m, i) => ({
    month: m,
    przed: Math.round(baseWm2 * monthlyFactors[i] * area / 1000 * 100) / 100,
    po: Math.round(baseWm2 * (1 - totalSaving) * monthlyFactors[i] * area / 1000 * 100) / 100,
  }));
}

const ModernizationPlan = ({ analysis, recommendedKw, installCost, subsidyAmount, annualHeatPumpCost, annualGasHeatingCost }: Props) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set());
  const [activeChart, setActiveChart] = useState<'costs' | 'demand' | 'savings'>('costs');

  const area = analysis.total_heated_area || analysis.estimated_sqm;
  const baseWm2 = analysis.heat_demand_w_per_m2 || 80;

  const phases = useMemo(() => buildPhases(analysis, recommendedKw, installCost), [analysis, recommendedKw, installCost]);

  const yearlyData = useMemo(
    () => generateYearlyProjection(phases, annualGasHeatingCost, baseWm2, area),
    [phases, annualGasHeatingCost, baseWm2, area]
  );

  const monthlyDemand = useMemo(
    () => generateMonthlyDemand(baseWm2, phases, area),
    [baseWm2, phases, area]
  );

  const totalCost = phases.reduce((s, p) => s + p.cost, 0);
  const totalSubsidy = phases.reduce((s, p) => s + p.cost * (p.subsidyPercent / 100), 0);
  const totalNet = totalCost - totalSubsidy;
  const totalSavingPct = Math.min(phases.reduce((s, p) => s + p.energySavingPercent, 0), 85);
  const newWm2 = Math.round(baseWm2 * (1 - totalSavingPct / 100));
  const annualSaving = annualGasHeatingCost * (totalSavingPct / 100);
  const roiYears = Math.ceil(totalNet / annualSaving);

  const togglePhase = (id: string) => {
    setCompletedPhases(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const phasesCostData = phases.map(p => ({
    name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name,
    koszt: p.cost,
    dotacja: p.cost * (p.subsidyPercent / 100),
    netto: p.cost * (1 - p.subsidyPercent / 100),
  }));

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="bg-gradient-to-br from-tauron/10 via-card to-tauron/5 border border-tauron/20 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-tauron" />
          <h3 className="font-bold font-display text-foreground">Kompleksowy Plan Modernizacji</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard icon={<PiggyBank className="h-4 w-4 text-green-500" />} label="Koszt netto" value={`${(totalNet / 1000).toFixed(0)} tys. zł`} sub={`z dotacją ${(totalSubsidy / 1000).toFixed(0)} tys. zł`} />
          <SummaryCard icon={<TrendingDown className="h-4 w-4 text-tauron" />} label="Redukcja energii" value={`-${totalSavingPct}%`} sub={`${baseWm2} → ${newWm2} W/m²`} />
          <SummaryCard icon={<Flame className="h-4 w-4 text-amber-500" />} label="Oszczędność/rok" value={`${(annualSaving / 1000).toFixed(1)} tys. zł`} sub={`ROI: ${roiYears} lat`} />
          <SummaryCard icon={<Leaf className="h-4 w-4 text-green-600" />} label="CO₂ mniej" value={`${((annualGasHeatingCost * totalSavingPct / 100) / 0.72 * 0.0002).toFixed(1)} t/rok`} sub="redukcja emisji" />
        </div>
      </div>

      {/* Timeline phases */}
      <div className="space-y-2">
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
          <Calendar className="h-4 w-4 text-tauron" />
          Etapy modernizacji ({phases.length} faz)
        </h4>
        {phases.map((phase, idx) => {
          const isExpanded = expandedPhase === phase.id;
          const isDone = completedPhases.has(phase.id);
          const netPhaseCost = phase.cost * (1 - phase.subsidyPercent / 100);
          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`rounded-2xl border transition-all ${isDone ? 'border-green-500/40 bg-green-500/5' : 'border-border bg-card'}`}
            >
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                className="w-full p-4 flex items-start gap-3 text-left"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePhase(phase.id); }}
                    className="transition-colors"
                  >
                    {isDone
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-muted-foreground">Etap {idx + 1}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[phase.priority]}`}>
                      {PRIORITY_LABELS[phase.priority]}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="h-2.5 w-2.5" />{phase.duration}
                    </span>
                  </div>
                  <p className={`text-sm font-medium mt-0.5 ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {phase.name}
                  </p>
                  <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>💰 {(netPhaseCost / 1000).toFixed(0)} tys. zł netto</span>
                    <span className="text-green-500 font-medium">📉 -{phase.energySavingPercent}% energii</span>
                    <span>🏛️ dotacja {phase.subsidyPercent}%</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3 ml-8">
                      <p className="text-xs text-muted-foreground">{phase.description}</p>
                      <div className="space-y-1.5">
                        {phase.actions.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <ArrowRight className="h-3 w-3 text-tauron flex-shrink-0 mt-0.5" />
                            <span className="text-foreground">{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/40 rounded-xl p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Koszt brutto</p>
                          <p className="text-sm font-bold text-foreground">{(phase.cost / 1000).toFixed(0)} tys.</p>
                        </div>
                        <div className="bg-green-500/10 rounded-xl p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Dotacja {phase.subsidyPercent}%</p>
                          <p className="text-sm font-bold text-green-500">-{(phase.cost * phase.subsidyPercent / 100 / 1000).toFixed(0)} tys.</p>
                        </div>
                        <div className="bg-tauron/10 rounded-xl p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Do zapłaty</p>
                          <p className="text-sm font-bold text-tauron">{(netPhaseCost / 1000).toFixed(0)} tys.</p>
                        </div>
                      </div>
                      {phase.demandReductionWm2 > 0 && (
                        <div className="bg-muted/30 rounded-xl p-2 text-center">
                          <p className="text-[10px] text-muted-foreground">Redukcja zapotrzebowania na ciepło</p>
                          <p className="text-sm font-bold text-foreground">
                            -{phase.demandReductionWm2.toFixed(0)} W/m² <span className="text-xs font-normal text-muted-foreground">({phase.energySavingPercent}%)</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Charts section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex border-b border-border bg-muted/30">
          {[
            { id: 'costs' as const, label: 'Koszty roczne', icon: <BarChart className="h-3 w-3" /> },
            { id: 'demand' as const, label: 'Zapotrzebowanie', icon: <Thermometer className="h-3 w-3" /> },
            { id: 'savings' as const, label: 'Oszczędności 20 lat', icon: <TrendingDown className="h-3 w-3" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`flex-1 py-2.5 px-3 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                activeChart === tab.id ? 'bg-card text-foreground border-b-2 border-tauron' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeChart === 'costs' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Koszty poszczególnych etapów (brutto vs netto po dotacji)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phasesCostData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }}
                      formatter={(value: number, name: string) => [`${(value / 1000).toFixed(1)} tys. zł`, name === 'netto' ? 'Netto' : name === 'dotacja' ? 'Dotacja' : 'Brutto']}
                    />
                    <Bar dataKey="netto" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Netto" />
                    <Bar dataKey="dotacja" fill="#22c55e" radius={[0, 4, 4, 0]} name="Dotacja" opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeChart === 'demand' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Miesięczne zapotrzebowanie na energię cieplną — przed i po modernizacji (kW)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyDemand} margin={{ left: -10, right: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }}
                      formatter={(v: number) => [`${v.toFixed(1)} kW`]}
                    />
                    <Area type="monotone" dataKey="przed" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} name="Przed modernizacją" strokeWidth={2} />
                    <Area type="monotone" dataKey="po" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Po modernizacji" strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-500/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Przed</p>
                  <p className="text-sm font-bold text-red-500">{baseWm2} W/m²</p>
                </div>
                <div className="bg-green-500/10 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Po modernizacji</p>
                  <p className="text-sm font-bold text-green-500">{newWm2} W/m²</p>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'savings' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Prognoza kosztów ogrzewania na 20 lat (z inflacją energii 5%/rok)</p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyData} margin={{ left: -10, right: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'Rok', position: 'bottom', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: 11 }}
                      formatter={(v: number, name: string) => [`${(v / 1000).toFixed(1)} tys. zł`, name]}
                    />
                    <Line type="monotone" dataKey="bezModernizacji" stroke="#ef4444" strokeWidth={2} dot={false} name="Bez modernizacji" />
                    <Line type="monotone" dataKey="poModernizacji" stroke="#22c55e" strokeWidth={2} dot={false} name="Po modernizacji" />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground">Skumulowana oszczędność po 20 latach</p>
                <p className="text-xl font-bold text-green-500">
                  {(yearlyData[yearlyData.length - 1].skumulowaneOszczednosci / 1000).toFixed(0)} tys. zł
                </p>
                <p className="text-[10px] text-muted-foreground">po odliczeniu kosztów inwestycji (netto po dotacjach)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-foreground">Postęp planu modernizacji</p>
          <p className="text-xs text-tauron font-bold">{completedPhases.size}/{phases.length} etapów</p>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-tauron/80 to-tauron rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completedPhases.size / phases.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Zaznaczaj ukończone etapy aby śledzić postęp termomodernizacji
        </p>
      </div>
    </div>
  );
};

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-card/60 border border-border rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

export default ModernizationPlan;
