import { motion } from 'framer-motion';
import { X, Zap, Sun, Wind, Battery, Car, Thermometer, Snowflake, ArrowDownToLine, ArrowUpFromLine, Trash2, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ConsumptionConfig,
  type GenerationConfig,
  type GraphNode,
  type InstallationType,
  INSTALLATION_LABELS,
  INSTALLATION_ICONS,
  getNodeStatus,
  getNodeBalance,
  getTotalConsumption,
  getTotalGeneration,
  NODE_STATUS_COLORS,
} from '@/lib/graph-types';

interface NodeConfigPanelProps {
  node: GraphNode;
  simulationHour: number | null;
  onUpdate: (node: GraphNode) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const TYPES: InstallationType[] = ['house', 'business', 'estate', 'transformer', 'solar_farm'];

const NodeConfigPanel = ({ node, simulationHour, onUpdate, onDelete, onClose }: NodeConfigPanelProps) => {
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(node.name);

  const hour = simulationHour ?? undefined;
  const status = getNodeStatus(node, hour);
  const balance = getNodeBalance(node, hour);
  const consumption = getTotalConsumption(node, hour);
  const generation = getTotalGeneration(node, hour);

  const updateConsumption = <K extends keyof ConsumptionConfig>(key: K, value: ConsumptionConfig[K]) => {
    onUpdate({ ...node, consumption: { ...node.consumption, [key]: value } });
  };

  const updateGeneration = <K extends keyof GenerationConfig>(key: K, value: GenerationConfig[K]) => {
    onUpdate({ ...node, generation: { ...node.generation, [key]: value } });
  };

  const saveName = () => {
    onUpdate({ ...node, name: tempName.trim() || node.name });
    setEditingName(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="w-full md:w-[360px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl">{INSTALLATION_ICONS[node.type]}</span>
            {editingName ? (
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="text-sm h-7"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-1 min-w-0">
                <h3 className="font-bold font-display text-foreground text-sm truncate">{node.name}</h3>
                <button onClick={() => { setTempName(node.name); setEditingName(true); }} className="p-0.5 rounded hover:bg-muted">
                  <Edit2 className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-2">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Type selector */}
        <div className="flex gap-1 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onUpdate({ ...node, type: t })}
              className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                node.type === t
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-transparent hover:bg-muted text-muted-foreground'
              }`}
            >
              {INSTALLATION_ICONS[t]} {INSTALLATION_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Balance summary */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30">
        <div className="text-center p-2 rounded-xl bg-red-500/10">
          <ArrowDownToLine className="h-3.5 w-3.5 mx-auto text-red-500 mb-1" />
          <p className="text-xs text-muted-foreground">Pobór</p>
          <p className="font-bold text-sm text-red-500">{consumption.toFixed(1)} kW</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-green-500/10">
          <ArrowUpFromLine className="h-3.5 w-3.5 mx-auto text-green-500 mb-1" />
          <p className="text-xs text-muted-foreground">Generacja</p>
          <p className="font-bold text-sm text-green-500">{generation.toFixed(1)} kW</p>
        </div>
        <div className="text-center p-2 rounded-xl" style={{ backgroundColor: `${NODE_STATUS_COLORS[status]}15` }}>
          <Zap className="h-3.5 w-3.5 mx-auto mb-1" style={{ color: NODE_STATUS_COLORS[status] }} />
          <p className="text-xs text-muted-foreground">Bilans</p>
          <p className="font-bold text-sm" style={{ color: NODE_STATUS_COLORS[status] }}>
            {balance > 0 ? '+' : ''}{balance.toFixed(1)} kW
          </p>
        </div>
      </div>

      {simulationHour !== null && (
        <div className="px-3 pt-2">
          <p className="text-[10px] text-muted-foreground text-center">
            📊 Wartości dla godziny {String(Math.floor(simulationHour)).padStart(2, '0')}:{String(Math.round((simulationHour % 1) * 60)).padStart(2, '0')}
          </p>
        </div>
      )}

      {/* Config tabs */}
      <Tabs defaultValue="consumption" className="p-3">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="consumption" className="gap-1.5 text-xs">
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Pobór
          </TabsTrigger>
          <TabsTrigger value="generation" className="gap-1.5 text-xs">
            <ArrowUpFromLine className="h-3.5 w-3.5" />
            Generacja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4 mt-3">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-muted-foreground" />Obciążenie bazowe</Label>
              <span className="font-mono text-muted-foreground">{node.consumption.base_kw.toFixed(1)} kW</span>
            </div>
            <Slider value={[node.consumption.base_kw]} onValueChange={([v]) => updateConsumption('base_kw', v)} min={0} max={50} step={0.5} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-muted-foreground" />Szczyt</Label>
              <span className="font-mono text-muted-foreground">{node.consumption.peak_kw.toFixed(1)} kW</span>
            </div>
            <Slider value={[node.consumption.peak_kw]} onValueChange={([v]) => updateConsumption('peak_kw', v)} min={0} max={100} step={1} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="flex items-center gap-1.5"><Snowflake className="h-3.5 w-3.5 text-muted-foreground" />Klimatyzacja (szt.)</Label>
              <span className="font-mono text-muted-foreground">{node.consumption.ac_units} × 2 kW</span>
            </div>
            <Slider value={[node.consumption.ac_units]} onValueChange={([v]) => updateConsumption('ac_units', v)} min={0} max={20} step={1} />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="flex items-center gap-1.5 text-xs"><Car className="h-3.5 w-3.5 text-muted-foreground" />Ładowarka EV (+7 kW)</Label>
            <Switch checked={node.consumption.ev_charger} onCheckedChange={(v) => updateConsumption('ev_charger', v)} />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="flex items-center gap-1.5 text-xs"><Thermometer className="h-3.5 w-3.5 text-muted-foreground" />Pompa ciepła (+5 kW)</Label>
            <Switch checked={node.consumption.heat_pump} onCheckedChange={(v) => updateConsumption('heat_pump', v)} />
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-4 mt-3">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5 text-yellow-500" />Fotowoltaika</Label>
              <span className="font-mono text-muted-foreground">{node.generation.pv_kw.toFixed(1)} kW</span>
            </div>
            <Slider value={[node.generation.pv_kw]} onValueChange={([v]) => updateGeneration('pv_kw', v)} min={0} max={200} step={0.5} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="flex items-center gap-1.5"><Wind className="h-3.5 w-3.5 text-blue-400" />Turbiny wiatrowe</Label>
              <span className="font-mono text-muted-foreground">{node.generation.wind_kw.toFixed(1)} kW</span>
            </div>
            <Slider value={[node.generation.wind_kw]} onValueChange={([v]) => updateGeneration('wind_kw', v)} min={0} max={50} step={0.5} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <Label className="flex items-center gap-1.5"><Battery className="h-3.5 w-3.5 text-green-500" />Magazyn energii</Label>
              <span className="font-mono text-muted-foreground">{node.generation.battery_kwh.toFixed(0)} kWh</span>
            </div>
            <Slider value={[node.generation.battery_kwh]} onValueChange={([v]) => updateGeneration('battery_kwh', v)} min={0} max={500} step={5} />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="flex items-center gap-1.5 text-xs"><Zap className="h-3.5 w-3.5 text-green-500" />Sprzedaż nadwyżki</Label>
            <Switch checked={node.generation.selling_excess} onCheckedChange={(v) => updateGeneration('selling_excess', v)} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete */}
      <div className="p-3 border-t border-border">
        <Button variant="destructive" size="sm" className="w-full gap-2 text-xs" onClick={() => onDelete(node.id)}>
          <Trash2 className="h-3.5 w-3.5" />
          Usuń węzeł z sieci
        </Button>
      </div>
    </motion.div>
  );
};

export default NodeConfigPanel;
