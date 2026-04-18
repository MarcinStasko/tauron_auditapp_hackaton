import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface HeatLossDistribution {
  walls_percent: number;
  roof_percent: number;
  windows_percent: number;
  floor_percent: number;
  ventilation_percent: number;
  thermal_bridges_percent: number;
}

interface Props {
  distribution?: HeatLossDistribution;
}

const DEFAULT: HeatLossDistribution = {
  walls_percent: 35,
  roof_percent: 25,
  windows_percent: 15,
  floor_percent: 10,
  ventilation_percent: 10,
  thermal_bridges_percent: 5,
};

function colorFor(pct: number): string {
  if (pct >= 30) return 'hsl(0, 75%, 55%)';
  if (pct >= 20) return 'hsl(20, 85%, 55%)';
  if (pct >= 12) return 'hsl(40, 90%, 55%)';
  if (pct >= 7) return 'hsl(70, 70%, 50%)';
  return 'hsl(140, 60%, 45%)';
}

const HeatLossMap = ({ distribution }: Props) => {
  const d = distribution ?? DEFAULT;

  const items: { key: keyof HeatLossDistribution; label: string; pct: number }[] = [
    { key: 'roof_percent', label: 'Dach', pct: d.roof_percent },
    { key: 'walls_percent', label: 'Ściany', pct: d.walls_percent },
    { key: 'windows_percent', label: 'Okna', pct: d.windows_percent },
    { key: 'floor_percent', label: 'Podłoga', pct: d.floor_percent },
    { key: 'ventilation_percent', label: 'Wentylacja', pct: d.ventilation_percent },
    { key: 'thermal_bridges_percent', label: 'Mostki', pct: d.thermal_bridges_percent },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="h-4 w-4 text-tauron" />
        <h4 className="text-sm font-bold text-foreground">Mapa cieplna strat</h4>
      </div>

      {/* SVG schematic of building */}
      <div className="bg-muted/20 rounded-xl p-4 flex justify-center">
        <svg viewBox="0 0 240 180" className="w-full max-w-xs">
          {/* Roof */}
          <polygon
            points="40,70 120,20 200,70"
            fill={colorFor(d.roof_percent)}
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
            opacity="0.85"
          />
          <text x="120" y="50" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
            {d.roof_percent}%
          </text>

          {/* Walls (left + right) */}
          <rect x="40" y="70" width="160" height="80" fill={colorFor(d.walls_percent)} stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.85" />

          {/* Windows */}
          <rect x="60" y="90" width="25" height="30" fill={colorFor(d.windows_percent)} stroke="white" strokeWidth="1.5" />
          <rect x="155" y="90" width="25" height="30" fill={colorFor(d.windows_percent)} stroke="white" strokeWidth="1.5" />
          <text x="72" y="110" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">{d.windows_percent}%</text>

          {/* Door */}
          <rect x="108" y="105" width="24" height="45" fill="hsl(30, 30%, 30%)" stroke="hsl(var(--border))" strokeWidth="1" />

          {/* Wall % label */}
          <text x="120" y="140" textAnchor="middle" fontSize="11" fontWeight="700" fill="white">
            ściany {d.walls_percent}%
          </text>

          {/* Floor */}
          <rect x="40" y="150" width="160" height="14" fill={colorFor(d.floor_percent)} stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.85" />
          <text x="120" y="161" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">
            podłoga {d.floor_percent}%
          </text>

          {/* Ventilation arrow */}
          <text x="120" y="14" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
            ↑ wentylacja {d.ventilation_percent}%
          </text>
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((it, i) => (
          <motion.div
            key={it.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1.5"
          >
            <div className="w-3 h-3 rounded" style={{ background: colorFor(it.pct) }} />
            <span className="text-xs text-muted-foreground flex-1">{it.label}</span>
            <span className="text-xs font-bold text-foreground">{it.pct}%</span>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Skala: zielony &lt; żółty &lt; pomarańczowy &lt; czerwony (większe straty)
      </p>
    </div>
  );
};

export default HeatLossMap;
