import { Moon, ArrowDownRight } from 'lucide-react';
import { formatPln } from '@/lib/calculations';
import type { FullCostReport } from '@/lib/types';

interface Props {
  report: FullCostReport;
  nightPercent: number;
}

const TariffComparison = ({ report, nightPercent }: Props) => {
  const scenarios = [
    {
      emoji: '📊',
      title: 'Mieszane użytkowanie G12 (60/40)',
      desc: '~60% zużycia w nocy/weekendy, 40% w dzień',
      cost: report.g12Blended.annual,
      savings: report.savingsG12Blended,
      monthly: report.g12Blended.monthly,
    },
    {
      emoji: '🎛️',
      title: `Twoje ustawienie (${nightPercent}% noc)`,
      desc: `${nightPercent}% zużycia w taniej taryfie nocnej`,
      cost: report.g12Custom.annual,
      savings: report.savingsG12Custom,
      monthly: report.g12Custom.monthly,
    },
    {
      emoji: '🌙',
      title: 'Tylko w nocy (po 22:00)',
      desc: '100% zużycia po 22:00 – maksymalna oszczędność',
      cost: report.g12Night.annual,
      savings: report.savingsG12Night,
      monthly: report.g12Night.monthly,
    },
  ];

  const maxMonthly = Math.max(report.g11.monthly, ...scenarios.map(s => s.monthly));

  return (
    <div className="rounded-2xl border border-tauron/20 bg-tauron/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Moon className="h-5 w-5 text-tauron" />
        <h3 className="font-semibold font-display text-foreground">Symulacje taryf G12</h3>
      </div>

      {scenarios.map((s, i) => (
        <div key={i} className="bg-card rounded-xl p-4 space-y-2 border border-border">
          <p className="text-sm font-medium text-foreground">{s.emoji} {s.title}</p>
          <p className="text-xs text-muted-foreground">{s.desc}</p>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Rocznie</p>
              <p className="font-bold text-foreground">{formatPln(s.cost)} zł</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Miesięcznie</p>
              <p className="font-bold text-foreground">{formatPln(s.monthly)} zł</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Oszczędność</p>
              <p className="font-bold text-green-600 flex items-center justify-center gap-0.5">
                {s.savings > 0 && <ArrowDownRight className="h-3.5 w-3.5" />}
                {s.savings > 0 ? '-' : ''}{formatPln(Math.abs(s.savings))} zł
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Visual bar comparison */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <p className="text-sm font-medium text-foreground mb-3">📅 Porównanie miesięczne</p>
        <div className="space-y-2">
          <CompBar label="G11 Standard" value={report.g11.monthly} max={maxMonthly} color="bg-muted-foreground" />
          <CompBar label="G12 Mieszany" value={report.g12Blended.monthly} max={maxMonthly} color="bg-amber-500" />
          <CompBar label={`G12 ${nightPercent}% noc`} value={report.g12Custom.monthly} max={maxMonthly} color="bg-blue-500" />
          <CompBar label="G12 Nocny" value={report.g12Night.monthly} max={maxMonthly} color="bg-tauron" />
        </div>
      </div>
    </div>
  );
};

function CompBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{formatPln(value)} zł</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default TariffComparison;
