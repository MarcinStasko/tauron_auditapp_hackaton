import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { GraphNode } from '@/lib/graph-types';
import { getTotalConsumption, getTotalGeneration } from '@/lib/graph-types';

interface Props {
  nodes: GraphNode[];
  currentHour: number | null;
}

const GridDailyChart = ({ nodes, currentHour }: Props) => {
  const data = useMemo(() => {
    const points = [];
    for (let h = 0; h <= 24; h += 0.5) {
      const consumption = nodes.reduce((s, n) => s + getTotalConsumption(n, h), 0);
      const generation = nodes.reduce((s, n) => s + getTotalGeneration(n, h), 0);
      const balance = generation - consumption;
      points.push({
        hour: h,
        label: `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 === 0 ? '00' : '30'}`,
        consumption: +consumption.toFixed(1),
        generation: +generation.toFixed(1),
        balance: +balance.toFixed(1),
      });
    }
    return points;
  }, [nodes]);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-foreground">📊 Bilans dobowy sieci (24h)</h3>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-red-500/60" /> Pobór</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-green-500/60" /> Generacja</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded bg-blue-500/60" /> Bilans</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorGen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: 'hsl(220, 10%, 55%)' }}
            interval={3}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: 'hsl(220, 10%, 55%)' }}
            tickLine={false}
            axisLine={false}
            unit=" kW"
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220, 20%, 12%)',
              border: '1px solid hsl(220, 15%, 25%)',
              borderRadius: '12px',
              fontSize: '11px',
            }}
            labelStyle={{ color: 'hsl(220, 10%, 70%)' }}
          />
          <ReferenceLine y={0} stroke="hsl(220, 10%, 35%)" strokeDasharray="4 4" />
          {currentHour !== null && (
            <ReferenceLine
              x={`${String(Math.floor(currentHour)).padStart(2, '0')}:${currentHour % 1 === 0 ? '00' : '30'}`}
              stroke="hsl(45, 100%, 60%)"
              strokeWidth={2}
              strokeDasharray="4 2"
              label={{ value: '▼', position: 'top', fontSize: 10, fill: 'hsl(45, 100%, 60%)' }}
            />
          )}
          <Area
            type="monotone"
            dataKey="consumption"
            name="Pobór"
            stroke="hsl(0, 84%, 60%)"
            fill="url(#colorCons)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="generation"
            name="Generacja"
            stroke="hsl(142, 71%, 45%)"
            fill="url(#colorGen)"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="balance"
            name="Bilans"
            stroke="hsl(220, 80%, 60%)"
            fill="none"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GridDailyChart;
