import { BarChart3, Zap } from 'lucide-react';
import { formatPln } from '@/lib/calculations';
import type { CostBreakdown } from '@/lib/types';

interface Props {
  g11: CostBreakdown;
  annualKwh: number;
}

const CostBreakdownCard = ({ g11, annualKwh }: Props) => (
  <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
    <div className="flex items-center gap-2 mb-1">
      <BarChart3 className="h-4 w-4 text-tauron" />
      <h3 className="font-semibold font-display text-foreground">Koszty w taryfie G11</h3>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <CostCell label="Dziennie" value={g11.daily} />
      <CostCell label="Tygodniowo" value={g11.weekly} />
      <CostCell label="Miesięcznie" value={g11.monthly} highlight />
      <CostCell label="Rocznie" value={g11.annual} highlight />
    </div>

    <div className="bg-muted/40 rounded-xl p-3 text-center">
      <p className="text-xs text-muted-foreground">Roczne zużycie energii</p>
      <p className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
        <Zap className="h-4 w-4 text-tauron" />
        {annualKwh.toFixed(1)} kWh
      </p>
    </div>
  </div>
);

function CostCell({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 text-center ${highlight ? 'bg-tauron/10' : 'bg-muted/40'}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-tauron' : 'text-foreground'}`}>
        {formatPln(value)} <span className="text-sm font-normal">zł</span>
      </p>
    </div>
  );
}

export default CostBreakdownCard;
