import { ArrowDownRight, Sparkles } from 'lucide-react';
import { formatPln, getEfficiencyRating } from '@/lib/calculations';
import type { FullCostReport } from '@/lib/types';

interface Props {
  report: FullCostReport;
  energyClass: string;
}

const SavingsSummary = ({ report, energyClass }: Props) => {
  const eff = getEfficiencyRating(energyClass);

  return (
    <div className="rounded-2xl border-2 border-tauron/30 bg-gradient-to-br from-tauron/5 to-tauron/10 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-tauron" />
        <h3 className="font-semibold font-display text-foreground">Podsumowanie</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCell label="Efektywność" value={eff.label} sub={eff.description} valueClass={eff.color} />
        <SummaryCell label="CO₂ rocznie" value={`${report.co2Annual.toFixed(0)} kg`} sub={`${report.equivalentTrees} drzew(a)`} />
        <SummaryCell label="Max oszczędność G12" value={`${formatPln(report.savingsG12Night)} zł`} sub="przy 100% nocą" valueClass="text-green-600" />
        <SummaryCell label="Koszt 10 lat" value={`${formatPln(report.costPer10Years)} zł`} sub="ze wzrostem cen ~3%/rok" />
      </div>
    </div>
  );
};

function SummaryCell({ label, value, sub, valueClass }: { label: string; value: string; sub: string; valueClass?: string }) {
  return (
    <div className="bg-card/80 rounded-xl p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${valueClass || 'text-foreground'}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default SavingsSummary;
