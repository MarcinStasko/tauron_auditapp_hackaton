import { Download, Upload, BarChart3, Leaf, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GraphNode, GraphEdge } from '@/lib/graph-types';
import { getTotalConsumption, getTotalGeneration, getNodeBalance } from '@/lib/graph-types';
import { toast } from 'sonner';

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
  currentHour: number | null;
  onImport: (nodes: GraphNode[], edges: GraphEdge[]) => void;
}

const RATE_PLN = 0.72; // PLN/kWh average

const GridStatsPanel = ({ nodes, edges, currentHour, onImport }: Props) => {
  const h = currentHour ?? undefined;
  const totalCons = nodes.reduce((s, n) => s + getTotalConsumption(n, h), 0);
  const totalGen = nodes.reduce((s, n) => s + getTotalGeneration(n, h), 0);
  const balance = totalGen - totalCons;
  const totalBattery = nodes.reduce((s, n) => s + n.generation.battery_kwh, 0);
  const totalPV = nodes.reduce((s, n) => s + n.generation.pv_kw, 0);
  const totalWind = nodes.reduce((s, n) => s + n.generation.wind_kw, 0);
  const sellingNodes = nodes.filter((n) => n.generation.selling_excess && getNodeBalance(n, h) > 0);
  const overloadedNodes = nodes.filter((n) => getNodeBalance(n, h) < -10);

  // Daily cost estimate (24h average × rate)
  const dailyAvgCons = (() => {
    let sum = 0;
    for (let hh = 0; hh < 24; hh += 0.5) sum += nodes.reduce((s, n) => s + getTotalConsumption(n, hh), 0);
    return sum / 48;
  })();
  const dailyCostPLN = dailyAvgCons * 24 * RATE_PLN;
  const annualCostPLN = dailyCostPLN * 365;

  const dailyAvgGen = (() => {
    let sum = 0;
    for (let hh = 0; hh < 24; hh += 0.5) sum += nodes.reduce((s, n) => s + getTotalGeneration(n, hh), 0);
    return sum / 48;
  })();
  const dailyGenKwh = dailyAvgGen * 24;
  const annualCO2Saved = (dailyGenKwh * 365 * 0.7) / 1000; // tons

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-grid-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Konfiguracja wyeksportowana');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event: Event) => {
      try {
        const target = event.target as HTMLInputElement | null;
        const file = target?.files?.[0];
        if (!file) {
          toast.error('Nie wybrano pliku');
          return;
        }
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.nodes && data.edges) {
          onImport(data.nodes, data.edges);
          toast.success('Konfiguracja zaimportowana');
        } else {
          toast.error('Nieprawidłowy format pliku');
        }
      } catch {
        toast.error('Błąd importu pliku');
      }
    };
    input.click();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Panel statystyk sieci
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={handleExport}>
            <Download className="h-3 w-3" /> Eksport
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7" onClick={handleImport}>
            <Upload className="h-3 w-3" /> Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Węzły" value={String(nodes.length)} sub={`${edges.length} połączeń`} />
        <StatCard label="Łączne PV" value={`${totalPV.toFixed(0)} kWp`} sub={`${totalWind.toFixed(0)} kW wiatr`} color="text-yellow-500" />
        <StatCard label="Magazyny" value={`${totalBattery.toFixed(0)} kWh`} sub={`${sellingNodes.length} sprzedających`} color="text-green-500" />
        <StatCard label="Aktualny pobór" value={`${totalCons.toFixed(1)} kW`} sub={`gen: ${totalGen.toFixed(1)} kW`} color="text-red-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <DollarSign className="h-4 w-4 mx-auto text-amber-500 mb-1" />
          <p className="text-xs text-muted-foreground">Szac. koszt roczny</p>
          <p className="text-lg font-bold text-foreground">{(annualCostPLN / 1000).toFixed(0)} tys. zł</p>
          <p className="text-[10px] text-muted-foreground">{dailyCostPLN.toFixed(0)} zł/dzień</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <Leaf className="h-4 w-4 mx-auto text-green-500 mb-1" />
          <p className="text-xs text-muted-foreground">CO₂ zaoszczędzone/rok</p>
          <p className="text-lg font-bold text-green-500">{annualCO2Saved.toFixed(1)} t</p>
          <p className="text-[10px] text-muted-foreground">{(dailyGenKwh).toFixed(0)} kWh/dzień OZE</p>
        </div>
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <AlertTriangle className="h-4 w-4 mx-auto text-amber-500 mb-1" />
          <p className="text-xs text-muted-foreground">Przeciążone węzły</p>
          <p className={`text-lg font-bold ${overloadedNodes.length > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {overloadedNodes.length}
          </p>
          <p className="text-[10px] text-muted-foreground">bilans &lt; -10 kW</p>
        </div>
      </div>

      <div className="bg-muted/20 rounded-xl p-3">
        <p className="text-xs text-muted-foreground mb-2">Bilans bieżący sieci</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
            {totalCons + totalGen > 0 && (
              <>
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-400 float-left transition-all"
                  style={{ width: `${(totalCons / (totalCons + totalGen)) * 100}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 float-left transition-all"
                  style={{ width: `${(totalGen / (totalCons + totalGen)) * 100}%` }}
                />
              </>
            )}
          </div>
          <span className={`text-sm font-bold font-mono ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {balance > 0 ? '+' : ''}{balance.toFixed(1)} kW
          </span>
        </div>
      </div>
    </div>
  );
};

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-muted/30 rounded-xl p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-display ${color ?? 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default GridStatsPanel;
