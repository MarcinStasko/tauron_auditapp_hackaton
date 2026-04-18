import { TrendingDown, Lightbulb } from 'lucide-react';
import { formatPln } from '@/lib/calculations';
import type { FullCostReport } from '@/lib/types';

interface Props {
  report: FullCostReport;
}

const TipsSection = ({ report }: Props) => (
  <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
    <div className="flex items-center gap-2">
      <TrendingDown className="h-4 w-4 text-green-600" />
      <h3 className="font-semibold text-sm font-display text-foreground">Porady oszczędnościowe</h3>
    </div>

    {/* Summary savings box */}
    <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">Łączny potencjał oszczędności</p>
      <p className="text-2xl font-bold text-green-600">
        do {formatPln(report.totalPotentialSavings)} zł/rok
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        (taryfa nocna + wyłączenie standby)
      </p>
    </div>

    <div className="space-y-3">
      <Tip
        emoji="⏰"
        title="Timer programowalny"
        desc="Kup timer za ~20 zł i automatycznie uruchamiaj urządzenia po 22:00 w taniej taryfie."
      />
      <Tip
        emoji="🔌"
        title="Listwa z wyłącznikiem"
        desc="Eliminuje standby wielu urządzeń naraz — oszczędność do 100 zł/rok w całym domu."
      />
      <Tip
        emoji="🧊"
        title="Temperatura lodówki"
        desc="Optymalna: 4°C (chłodziarka) i -18°C (zamrażarka). Każdy °C niżej = ~5% więcej prądu."
      />
      <Tip
        emoji="♨️"
        title="Tryb ECO"
        desc="Pralki i zmywarki w trybie ECO zużywają 30-50% mniej energii niż w programie standardowym."
      />
      <Tip
        emoji="📱"
        title="Monitoruj zużycie"
        desc="Miernik zużycia prądu do gniazdka (~30 zł) pokaże dokładne zużycie każdego urządzenia."
      />
      <Tip
        emoji="🏷️"
        title="Wymiana urządzenia"
        desc="Przejście z klasy E na A oszczędza nawet 50-70% energii — zwrot inwestycji w 3-5 lat."
      />
    </div>
  </div>
);

function Tip({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
      <span className="text-lg shrink-0">{emoji}</span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export default TipsSection;
