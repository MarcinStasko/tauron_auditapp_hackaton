import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import type { EnergyData, UsageConfig } from '@/lib/types';
import { ENERGY_CLASS_BADGE_COLORS } from '@/lib/constants';
import { generateFullReport, DEFAULT_CONFIG } from '@/lib/calculations';
import UsageConfigurator from './UsageConfigurator';
import CostBreakdownCard from './CostBreakdownCard';
import TariffComparison from './TariffComparison';
import SavingsSummary from './SavingsSummary';
import StandbyCard from './StandbyCard';
import MonthlyChart from './MonthlyChart';
import EnvironmentImpact from './EnvironmentImpact';
import TipsSection from './TipsSection';
import DynamicTariffChart from './DynamicTariffChart';
import MacroImpact from './MacroImpact';
import ExportButton from './ExportButton';
import { Button } from '@/components/ui/button';

interface Props {
  data: EnergyData;
  onReset: () => void;
}

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

const ResultsDashboard = ({ data, onReset }: Props) => {
  const [config, setConfig] = useState<UsageConfig>({
    ...DEFAULT_CONFIG,
    hoursPerDay: data.is_per_cycle ? 1 : 24,
    daysPerWeek: data.is_per_cycle ? 7 : 7,
  });

  const report = useMemo(() => generateFullReport(data, config), [data, config]);
  const badgeColor = ENERGY_CLASS_BADGE_COLORS[data.energy_class] ?? 'bg-muted text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto space-y-4"
    >
      {/* Device Header */}
      <motion.div {...fade(0)} className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Urządzenie</p>
            <p className="text-xl font-bold font-display text-foreground">{data.device_type}</p>
          </div>
          <div className={`${badgeColor} text-xl font-black px-3 py-2 rounded-xl min-w-[3rem] text-center`}>
            {data.energy_class}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {data.consumption_per_cycle_kwh && `${data.consumption_per_cycle_kwh} kWh/cykl`}
          {data.consumption_per_100_cycles && `${data.consumption_per_100_cycles} kWh/100 cykli`}
          {data.consumption_annual && !data.is_per_cycle && `${data.consumption_annual} kWh/rok (z etykiety)`}
        </p>
      </motion.div>

      {/* Usage Configuration */}
      <motion.div {...fade(0.05)} className="print:hidden">
        <UsageConfigurator config={config} onChange={setConfig} isPerCycle={data.is_per_cycle} />
      </motion.div>

      {/* Cost Breakdown G11 */}
      <motion.div {...fade(0.1)}>
        <CostBreakdownCard g11={report.g11} annualKwh={report.annualKwh} />
      </motion.div>

      {/* Monthly chart */}
      <motion.div {...fade(0.15)}>
        <MonthlyChart monthlyBreakdown={report.monthlyBreakdownG11} />
      </motion.div>

      {/* Tariff Comparison G12 */}
      <motion.div {...fade(0.2)}>
        <TariffComparison report={report} nightPercent={config.nightUsagePercent} />
      </motion.div>

      {/* Savings Summary */}
      <motion.div {...fade(0.25)}>
        <SavingsSummary report={report} energyClass={data.energy_class} />
      </motion.div>

      {/* Standby */}
      <motion.div {...fade(0.3)}>
        <StandbyCard standby={report.standby} enabled={config.standbyEnabled} />
      </motion.div>

      {/* Dynamic Tariff */}
      <motion.div {...fade(0.35)}>
        <DynamicTariffChart
          cycleKwh={data.consumption_per_cycle_kwh ?? (report.annualKwh / 208)}
          deviceName={data.device_type}
        />
      </motion.div>

      {/* Environment */}
      <motion.div {...fade(0.4)}>
        <EnvironmentImpact report={report} />
      </motion.div>

      {/* Macro Impact */}
      <motion.div {...fade(0.45)}>
        <MacroImpact
          annualSavingsZl={report.totalPotentialSavings}
          annualSavingsKwh={report.totalPotentialSavings / 1.15}
        />
      </motion.div>

      {/* Tips */}
      <motion.div {...fade(0.5)}>
        <TipsSection report={report} />
      </motion.div>

      {/* Actions */}
      <motion.div {...fade(0.45)} className="flex gap-3 print:hidden pb-8">
        <Button onClick={onReset} variant="ghost" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Nowe skanowanie
        </Button>
        <div className="flex-1">
          <ExportButton />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultsDashboard;
