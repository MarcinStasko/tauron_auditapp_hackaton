import { Leaf, TreePine, Factory } from 'lucide-react';
import { formatPln } from '@/lib/calculations';
import type { FullCostReport } from '@/lib/types';

interface Props {
  report: FullCostReport;
}

const EnvironmentImpact = ({ report }: Props) => (
  <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
    <div className="flex items-center gap-2">
      <Leaf className="h-4 w-4 text-green-600" />
      <h3 className="font-semibold font-display text-foreground">Wpływ na środowisko</h3>
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div className="bg-muted/40 rounded-xl p-3 text-center">
        <Factory className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Emisja CO₂</p>
        <p className="text-lg font-bold text-foreground">{report.co2Annual.toFixed(1)}</p>
        <p className="text-xs text-muted-foreground">kg/rok</p>
      </div>
      <div className="bg-muted/40 rounded-xl p-3 text-center">
        <TreePine className="h-5 w-5 mx-auto mb-1 text-green-600" />
        <p className="text-xs text-muted-foreground">Potrzeba drzew</p>
        <p className="text-lg font-bold text-foreground">{report.equivalentTrees}</p>
        <p className="text-xs text-muted-foreground">do neutralizacji</p>
      </div>
      <div className="bg-muted/40 rounded-xl p-3 text-center">
        <span className="text-xl block mb-1">💰</span>
        <p className="text-xs text-muted-foreground">Koszt 10 lat</p>
        <p className="text-lg font-bold text-foreground">{formatPln(report.costPer10Years)}</p>
        <p className="text-xs text-muted-foreground">zł</p>
      </div>
    </div>
  </div>
);

export default EnvironmentImpact;
