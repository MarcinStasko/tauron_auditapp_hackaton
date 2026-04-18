import { useState, useMemo } from 'react';
import { Sliders, TrendingDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { DetailedHouseAnalysis } from './HouseAuditor';

interface Props {
  analysis: DetailedHouseAnalysis;
  area: number;
  baseDemandKw: number;
  baseAnnualGasCost: number;
}

const WhatIfSimulator = ({ analysis, area, baseDemandKw, baseAnnualGasCost }: Props) => {
  const [wallIns, setWallIns] = useState(0); // cm of added insulation
  const [windowsUpgrade, setWindowsUpgrade] = useState(0); // 0-100% upgrade
  const [roofIns, setRoofIns] = useState(0); // cm
  const [ventilation, setVentilation] = useState(false); // recuperation

  const result = useMemo(() => {
    // Simple model: each cm of insulation reduces wall losses by ~3%
    const wallReduction = Math.min(0.55, wallIns * 0.03);
    const roofReduction = Math.min(0.6, roofIns * 0.025);
    const windowReduction = (windowsUpgrade / 100) * 0.45;
    const ventReduction = ventilation ? 0.2 : 0;

    // Distribution defaults
    const dist = analysis.heat_loss_distribution ?? {
      walls_percent: 35, roof_percent: 25, windows_percent: 15,
      floor_percent: 10, ventilation_percent: 10, thermal_bridges_percent: 5,
    };

    const totalReduction =
      (dist.walls_percent / 100) * wallReduction +
      (dist.roof_percent / 100) * roofReduction +
      (dist.windows_percent / 100) * windowReduction +
      (dist.ventilation_percent / 100) * ventReduction;

    const newDemandKw = baseDemandKw * (1 - totalReduction);
    const newGasCost = baseAnnualGasCost * (1 - totalReduction);
    const savings = baseAnnualGasCost - newGasCost;

    // Cost
    const cost =
      wallIns * area * 14 + // ~14 zł/cm/m² powierzchni grzewczej (ściany ≈ 1.4× area)
      roofIns * area * 8 +
      (windowsUpgrade / 100) * 18000 +
      (ventilation ? 22000 : 0);

    return { newDemandKw, newGasCost, savings, totalReduction, cost };
  }, [wallIns, windowsUpgrade, roofIns, ventilation, area, baseDemandKw, baseAnnualGasCost, analysis]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sliders className="h-4 w-4 text-tauron" />
        <h4 className="text-sm font-bold text-foreground">Symulator „co jeśli"</h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Przesuwaj suwaki, aby zobaczyć wpływ konkretnych ulepszeń na zapotrzebowanie cieplne i koszty.
      </p>

      <div className="space-y-4 bg-muted/20 rounded-xl p-4">
        <SliderRow
          label="Ocieplenie ścian"
          value={wallIns}
          unit="cm styropianu"
          min={0}
          max={25}
          step={1}
          onChange={setWallIns}
        />
        <SliderRow
          label="Ocieplenie dachu"
          value={roofIns}
          unit="cm wełny"
          min={0}
          max={35}
          step={1}
          onChange={setRoofIns}
        />
        <SliderRow
          label="Wymiana okien"
          value={windowsUpgrade}
          unit="% okien wymienione"
          min={0}
          max={100}
          step={10}
          onChange={setWindowsUpgrade}
        />
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={ventilation}
            onChange={(e) => setVentilation(e.target.checked)}
            className="w-4 h-4 rounded accent-tauron"
          />
          <span className="text-xs text-foreground">Wentylacja mechaniczna z rekuperacją (+22 000 zł)</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Nowe zapotrzebowanie</p>
          <p className="text-lg font-bold text-tauron">{result.newDemandKw.toFixed(1)} kW</p>
          <p className="text-[10px] text-muted-foreground">było {baseDemandKw.toFixed(1)} kW</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground uppercase">Koszt ogrz./rok</p>
          <p className="text-lg font-bold text-foreground">{(result.newGasCost / 1000).toFixed(1)}k zł</p>
          <p className="text-[10px] text-muted-foreground">było {(baseAnnualGasCost / 1000).toFixed(1)}k zł</p>
        </div>
      </div>

      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <span className="text-sm font-bold text-green-600">
              -{(result.totalReduction * 100).toFixed(0)}% strat
            </span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Oszczędność / rok</p>
            <p className="text-sm font-bold text-green-600">{result.savings.toFixed(0)} zł</p>
          </div>
        </div>
        {result.cost > 0 && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Koszt inwestycji: ~{(result.cost / 1000).toFixed(1)}k zł · zwrot: {result.savings > 0 ? Math.ceil(result.cost / result.savings) : '—'} lat
          </p>
        )}
      </div>
    </div>
  );
};

interface SliderRowProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

const SliderRow = ({ label, value, unit, min, max, step, onChange }: SliderRowProps) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground font-medium">{label}</span>
      <span className="text-xs text-tauron font-bold">{value} {unit}</span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
    />
  </div>
);

export default WhatIfSimulator;
