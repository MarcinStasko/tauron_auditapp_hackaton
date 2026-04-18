import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, Home, Shield, TrendingDown, RotateCcw, Phone,
  Sun, Droplets, Wind as WindIcon, Layers, Wrench, Zap,
  ChevronLeft, ChevronRight, Flame, Leaf, FileText, BarChart3, Scale,
  AlertTriangle, Sliders, Box,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DetailedHouseAnalysis } from './HouseAuditor';
import ModernizationPlan from './ModernizationPlan';
import PdfReportButton from './PdfReportButton';
import ScenarioComparison from './ScenarioComparison';
import HeatLossMap from './HeatLossMap';
import EnvelopeInventory from './EnvelopeInventory';
import RiskFlags from './RiskFlags';
import WhatIfSimulator from './WhatIfSimulator';
import Building3DModel, { type LabeledPhoto } from './Building3DModel';

const INSULATION_LABELS: Record<string, string> = { Poor: 'Słaba', Average: 'Średnia', Good: 'Dobra' };
const INSULATION_COLORS: Record<string, string> = { Poor: 'text-red-500', Average: 'text-amber-500', Good: 'text-green-500' };
const AIRTIGHT_LABELS: Record<string, string> = { Poor: 'Nieszczelny', Average: 'Średni', Good: 'Szczelny' };

const PUMP_SIZES = [5, 8, 10, 12, 14, 16, 20, 25];
function recommendPump(kw: number): number {
  return PUMP_SIZES.find((s) => s >= kw) ?? PUMP_SIZES[PUMP_SIZES.length - 1];
}

interface Props {
  analysis: DetailedHouseAnalysis;
  previews: string[];
  labeledPhotos?: LabeledPhoto[];
  onReset: () => void;
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const HeatPumpResult = ({ analysis, previews, labeledPhotos, onReset }: Props) => {
  const [photoIdx, setPhotoIdx] = useState(0);

  const area = analysis.total_heated_area || analysis.estimated_sqm;
  const wPerM2 = analysis.heat_demand_w_per_m2 || 80;
  const demandKw = (area * wPerM2) / 1000;
  const recommendedKw = recommendPump(demandKw);

  const annualGasHeatingCost = analysis.heating_cost_comparison?.gas_annual_pln ?? area * 45;
  const annualCoalCost = analysis.heating_cost_comparison?.coal_annual_pln ?? area * 35;
  const annualHeatPumpCost = analysis.heating_cost_comparison?.heat_pump_annual_pln ?? area * 22;
  const annualElectricCost = analysis.heating_cost_comparison?.electric_annual_pln ?? area * 65;
  const annualSavings = annualGasHeatingCost - annualHeatPumpCost;
  const installCost = recommendedKw * 5500;

  const subsidyPercent = analysis.insulation_status === 'Poor' ? 60 : analysis.insulation_status === 'Average' ? 40 : 25;
  const subsidyAmount = Math.min(installCost * (subsidyPercent / 100), 36000);
  const netCost = installCost - subsidyAmount;
  const netRoiYears = Math.ceil(netCost / annualSavings);

  const co2GasTons = (annualGasHeatingCost / 0.72) * 0.0002; // rough
  const co2HeatPumpTons = (annualHeatPumpCost / 0.72) * 0.00007;
  const co2Saved = co2GasTons - co2HeatPumpTons;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl mx-auto space-y-4">
      {/* Header with photo gallery */}
      <motion.div {...fade(0)} className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-start gap-4">
          {/* Photo gallery */}
          {previews.length > 0 && (
            <div className="flex-shrink-0 relative">
              <img
                src={previews[photoIdx]}
                alt="Budynek"
                className="w-28 h-28 rounded-xl object-cover border border-border"
              />
              {previews.length > 1 && (
                <>
                  <button
                    onClick={() => setPhotoIdx(i => (i - 1 + previews.length) % previews.length)}
                    className="absolute left-0.5 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-0.5 hover:bg-background"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setPhotoIdx(i => (i + 1) % previews.length)}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 bg-background/70 rounded-full p-0.5 hover:bg-background"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                    {previews.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === photoIdx ? 'bg-tauron' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Szczegółowy Audyt AI</p>
              <span className="text-[10px] bg-tauron/10 text-tauron px-1.5 py-0.5 rounded-md font-medium">
                {previews.length} zdjęć
              </span>
            </div>
            <p className="text-xl font-bold font-display text-foreground">{analysis.building_type}</p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <span className="bg-muted px-2 py-0.5 rounded-lg">~{analysis.construction_year_estimate} r.</span>
              <span className="bg-muted px-2 py-0.5 rounded-lg">{analysis.floors} piętr{analysis.floors === 1 ? 'o' : 'a'}</span>
              <span className="bg-muted px-2 py-0.5 rounded-lg">{area} m²</span>
              <span className={`px-2 py-0.5 rounded-lg font-medium ${
                analysis.energy_class_estimate <= 'C' ? 'bg-green-500/15 text-green-500' : 'bg-amber-500/15 text-amber-500'
              }`}>
                Klasa {analysis.energy_class_estimate}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Overall summary narrative */}
      {analysis.overall_summary && (
        <motion.div {...fade(0.05)} className="rounded-2xl bg-gradient-to-br from-muted/50 via-card to-muted/30 border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-tauron" />
            <h3 className="text-sm font-bold font-display text-foreground">Podsumowanie eksperckie</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.overall_summary}</p>
        </motion.div>
      )}

      {/* Quick stats */}
      <motion.div {...fade(0.1)} className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MiniStat icon={<Home className="h-4 w-4 text-tauron" />} label="Pow. grzewcza" value={`${area}`} unit="m²" />
        <MiniStat icon={<Shield className="h-4 w-4 text-tauron" />} label="Izolacja" value={INSULATION_LABELS[analysis.insulation_status]} color={INSULATION_COLORS[analysis.insulation_status]} />
        <MiniStat icon={<Thermometer className="h-4 w-4 text-tauron" />} label="Zapotrzebowanie" value={demandKw.toFixed(1)} unit="kW" />
        <MiniStat icon={<WindIcon className="h-4 w-4 text-tauron" />} label="Szczelność" value={AIRTIGHT_LABELS[analysis.air_tightness]} />
      </motion.div>

      {/* Detailed tabs */}
      <motion.div {...fade(0.15)}>
        <Tabs defaultValue="envelope" className="bg-card border border-border rounded-2xl overflow-hidden">
          <TabsList className="w-full grid grid-cols-5 md:grid-cols-9 rounded-none border-b border-border bg-muted/30 h-auto">
            <TabsTrigger value="envelope" className="text-[10px] gap-1 py-2"><Layers className="h-3 w-3" />Obudowa</TabsTrigger>
            <TabsTrigger value="model3d" className="text-[10px] gap-1 py-2"><Box className="h-3 w-3" />Model 3D</TabsTrigger>
            <TabsTrigger value="inventory" className="text-[10px] gap-1 py-2"><BarChart3 className="h-3 w-3" />Przegrody</TabsTrigger>
            <TabsTrigger value="heatmap" className="text-[10px] gap-1 py-2"><Flame className="h-3 w-3" />Mapa strat</TabsTrigger>
            <TabsTrigger value="risks" className="text-[10px] gap-1 py-2"><AlertTriangle className="h-3 w-3" />Ryzyka</TabsTrigger>
            <TabsTrigger value="heating" className="text-[10px] gap-1 py-2"><Thermometer className="h-3 w-3" />Grzanie</TabsTrigger>
            <TabsTrigger value="solar" className="text-[10px] gap-1 py-2"><Sun className="h-3 w-3" />Solar</TabsTrigger>
            <TabsTrigger value="simulator" className="text-[10px] gap-1 py-2"><Sliders className="h-3 w-3" />Symulator</TabsTrigger>
            <TabsTrigger value="improvements" className="text-[10px] gap-1 py-2"><Wrench className="h-3 w-3" />Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="envelope" className="p-4 space-y-3">
            <DetailRow label="Ściany" quality={analysis.wall_insulation.quality} detail={analysis.wall_insulation.details} />
            <DetailRow label="Okna" quality={analysis.windows.quality} detail={`${analysis.windows.type} — ${analysis.windows.details}`} />
            <DetailRow label="Dach" quality={analysis.roof.quality} detail={`${analysis.roof.material} — ${analysis.roof.details}`} />
            {analysis.thermal_bridges.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs font-medium text-amber-500 mb-1">⚠️ Mostki termiczne</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {analysis.thermal_bridges.map((b, i) => <li key={i}>• {b}</li>)}
                </ul>
              </div>
            )}
            {analysis.moisture_issues && analysis.moisture_issues !== 'None' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-xs font-medium text-red-500 mb-1"><Droplets className="h-3 w-3 inline" /> Problemy z wilgocią</p>
                <p className="text-xs text-muted-foreground">{analysis.moisture_issues}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="model3d" className="p-4">
            <Building3DModel analysis={analysis} labeledPhotos={labeledPhotos ?? previews.map((p, i) => ({ label: `photo-${i}`, preview: p }))} />
          </TabsContent>

          <TabsContent value="inventory" className="p-4">
            <EnvelopeInventory analysis={analysis} area={area} />
          </TabsContent>

          <TabsContent value="heatmap" className="p-4">
            <HeatLossMap distribution={analysis.heat_loss_distribution} />
          </TabsContent>

          <TabsContent value="risks" className="p-4">
            <RiskFlags analysis={analysis} />
          </TabsContent>

          <TabsContent value="simulator" className="p-4">
            <WhatIfSimulator
              analysis={analysis}
              area={area}
              baseDemandKw={demandKw}
              baseAnnualGasCost={annualGasHeatingCost}
            />
          </TabsContent>

          <TabsContent value="heating" className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Komin" value={analysis.heating_clues.chimney_type} />
              <InfoCard label="Zapotrzebowanie" value={`${wPerM2} W/m²`} />
            </div>
            {analysis.heating_clues.existing_systems.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Istniejące systemy:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.heating_clues.existing_systems.map((s, i) => (
                    <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.heating_clues.notes && (
              <p className="text-xs text-muted-foreground italic">{analysis.heating_clues.notes}</p>
            )}
            <div className="bg-muted/30 rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Obliczenia zapotrzebowania:</p>
              <p className="text-xs font-mono text-foreground">
                {area} m² × {wPerM2} W/m² = {(area * wPerM2 / 1000).toFixed(1)} kW → rekomendacja: {recommendedKw} kW
              </p>
            </div>
          </TabsContent>

          <TabsContent value="solar" className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Orientacja dachu" value={analysis.solar_potential.roof_orientation} />
              <InfoCard label="Kąt nachylenia" value={`${analysis.solar_potential.roof_angle_deg}°`} />
              <InfoCard label="Dostępna pow." value={`${analysis.solar_potential.available_area_sqm} m²`} />
              <InfoCard label="Rekomendacja PV" value={`${analysis.solar_potential.recommended_pv_kwp} kWp`} highlight />
            </div>
            {analysis.solar_potential.shading_issues && analysis.solar_potential.shading_issues !== 'None' && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs text-amber-500">⚠️ Zacienienie: {analysis.solar_potential.shading_issues}</p>
              </div>
            )}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground">Szacowana roczna produkcja PV</p>
              <p className="text-lg font-bold text-green-500">
                {(analysis.solar_potential.recommended_pv_kwp * 1000).toFixed(0)} kWh/rok
              </p>
              <p className="text-xs text-muted-foreground">
                Oszczędność: ~{((analysis.solar_potential.recommended_pv_kwp * 1000 * 0.72) / 1000).toFixed(1)} tys. zł/rok
              </p>
            </div>
          </TabsContent>

          {/* Heating cost comparison tab */}
          <TabsContent value="costs" className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground mb-2">Roczny koszt ogrzewania w zależności od źródła ciepła:</p>
            <div className="space-y-2">
              <CostBar label="Prąd (grzejniki)" cost={annualElectricCost} maxCost={annualElectricCost} color="bg-red-500" icon="⚡" />
              <CostBar label="Gaz ziemny" cost={annualGasHeatingCost} maxCost={annualElectricCost} color="bg-amber-500" icon="🔥" />
              <CostBar label="Węgiel" cost={annualCoalCost} maxCost={annualElectricCost} color="bg-stone-500" icon="🪨" />
              <CostBar label="Pompa ciepła" cost={annualHeatPumpCost} maxCost={annualElectricCost} color="bg-green-500" icon="♻️" highlight />
            </div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center mt-3">
              <p className="text-xs text-muted-foreground">Pompa ciepła oszczędza vs gaz</p>
              <p className="text-xl font-bold text-green-500">{((1 - annualHeatPumpCost / annualGasHeatingCost) * 100).toFixed(0)}% rocznie</p>
              <p className="text-xs text-muted-foreground">{(annualSavings).toFixed(0)} zł/rok mniej</p>
            </div>
          </TabsContent>

          <TabsContent value="compare" className="p-4">
            <ScenarioComparison
              analysis={analysis}
              area={area}
              demandKw={demandKw}
              annualGasHeatingCost={annualGasHeatingCost}
              annualHeatPumpCost={annualHeatPumpCost}
              annualElectricCost={annualElectricCost}
              recommendedKw={recommendedKw}
            />
          </TabsContent>

          <TabsContent value="improvements" className="p-4">
            <ModernizationPlan
              analysis={analysis}
              recommendedKw={recommendedKw}
              installCost={installCost}
              subsidyAmount={subsidyAmount}
              annualHeatPumpCost={annualHeatPumpCost}
              annualGasHeatingCost={annualGasHeatingCost}
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Heat pump recommendation */}
      <motion.div {...fade(0.2)} className="rounded-2xl border-2 border-tauron/30 bg-gradient-to-br from-tauron/10 via-card to-tauron/5 p-6 text-center space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Rekomendacja AI — Pompa Ciepła</p>
        <p className="text-5xl font-black font-display text-tauron">{recommendedKw} kW</p>
        <p className="text-sm text-muted-foreground">Powietrze-woda · COP ~3.5 · klasa A+++</p>
        <p className="text-xs text-muted-foreground">
          {area} m² × {wPerM2} W/m² = {demandKw.toFixed(1)} kW → {recommendedKw} kW
        </p>
      </motion.div>

      {/* Financial analysis */}
      <motion.div {...fade(0.3)} className="rounded-2xl bg-card border border-border p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold font-display text-foreground">Analiza finansowa i ekologiczna</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ROICard label="Koszt instalacji" value={`${(installCost / 1000).toFixed(0)} tys.`} unit="zł" />
          <ROICard label={`Dotacja (~${subsidyPercent}%)`} value={`-${(subsidyAmount / 1000).toFixed(0)} tys.`} unit="zł" color="text-green-500" />
          <ROICard label="Koszt netto" value={`${(netCost / 1000).toFixed(0)} tys.`} unit="zł" color="text-tauron" />
          <ROICard label="Zwrot inwestycji" value={`${netRoiYears}`} unit="lat" color="text-green-600" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-500/10 rounded-xl p-3 text-center">
            <Flame className="h-4 w-4 mx-auto text-red-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">Gaz/rok</p>
            <p className="text-lg font-bold text-red-500">{(annualGasHeatingCost / 1000).toFixed(1)}k zł</p>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 text-center">
            <Zap className="h-4 w-4 mx-auto text-green-500 mb-1" />
            <p className="text-[10px] text-muted-foreground">PC/rok</p>
            <p className="text-lg font-bold text-green-500">{(annualHeatPumpCost / 1000).toFixed(1)}k zł</p>
          </div>
          <div className="bg-green-500/10 rounded-xl p-3 text-center">
            <Leaf className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-[10px] text-muted-foreground">CO₂ mniej/rok</p>
            <p className="text-lg font-bold text-green-600">{co2Saved.toFixed(1)} t</p>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
          <p className="text-sm text-foreground">
            Roczna oszczędność: <span className="font-bold text-green-600">{(annualSavings / 1000).toFixed(1)} tys. zł</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Program „Czyste Powietrze" — do {subsidyPercent}% dofinansowania
          </p>
        </div>
      </motion.div>

      {/* PDF Report */}
      <motion.div {...fade(0.35)}>
        <PdfReportButton
          analysis={analysis}
          previews={previews}
          recommendedKw={recommendedKw}
          installCost={installCost}
          subsidyAmount={subsidyAmount}
          subsidyPercent={subsidyPercent}
          netCost={netCost}
          netRoiYears={netRoiYears}
          annualSavings={annualSavings}
          annualGasHeatingCost={annualGasHeatingCost}
          annualHeatPumpCost={annualHeatPumpCost}
          annualCoalCost={annualCoalCost}
          annualElectricCost={annualElectricCost}
          co2Saved={co2Saved}
          area={area}
          wPerM2={wPerM2}
          demandKw={demandKw}
        />
      </motion.div>

      {/* CTA */}
      <motion.div {...fade(0.4)}>
        <Button className="w-full h-14 text-base font-bold gap-3 bg-tauron hover:bg-tauron/90 text-tauron-foreground rounded-2xl">
          <Phone className="h-5 w-5" />
          Zamów darmowy audyt techniczny Tauron
        </Button>
      </motion.div>

      <motion.div {...fade(0.45)} className="print:hidden pb-8">
        <Button onClick={onReset} variant="ghost" className="gap-2 w-full">
          <RotateCcw className="h-4 w-4" />
          Nowa analiza
        </Button>
      </motion.div>
    </motion.div>
  );
};

/* --- Helper components --- */

function MiniStat({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-2.5 text-center">
      <div className="mx-auto mb-1">{icon}</div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${color ?? 'text-foreground'}`}>{value}{unit && <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>}</p>
    </div>
  );
}

function DetailRow({ label, quality, detail }: { label: string; quality: string; detail: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
      <div className="flex-shrink-0">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
          quality === 'Good' ? 'bg-green-500/15 text-green-500' : quality === 'Average' ? 'bg-amber-500/15 text-amber-500' : 'bg-red-500/15 text-red-500'
        }`}>{INSULATION_LABELS[quality] ?? quality}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-tauron/10 border border-tauron/20' : 'bg-muted/30'}`}>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-tauron' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function ROICard({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-3 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${color ?? 'text-foreground'}`}>{value} <span className="text-xs font-normal">{unit}</span></p>
    </div>
  );
}

function CostBar({ label, cost, maxCost, color, icon, highlight }: { label: string; cost: number; maxCost: number; color: string; icon: string; highlight?: boolean }) {
  const pct = (cost / maxCost) * 100;
  return (
    <div className={`rounded-xl p-3 ${highlight ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30'}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-foreground font-medium">{icon} {label}</span>
        <span className={`text-sm font-bold ${highlight ? 'text-green-500' : 'text-foreground'}`}>{(cost / 1000).toFixed(1)}k zł/rok</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default HeatPumpResult;
