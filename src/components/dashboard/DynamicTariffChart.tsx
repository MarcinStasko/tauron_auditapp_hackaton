import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock, TrendingDown } from 'lucide-react';
import { formatPln } from '@/lib/calculations';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

// Mock dynamic tariff data – 24 hours, PLN/kWh
const MOCK_DYNAMIC_DAY = [
  { hour: 0, rate: 0.52, label: '00:00' },
  { hour: 1, rate: 0.48, label: '01:00' },
  { hour: 2, rate: 0.44, label: '02:00' },
  { hour: 3, rate: 0.42, label: '03:00' },
  { hour: 4, rate: 0.45, label: '04:00' },
  { hour: 5, rate: 0.55, label: '05:00' },
  { hour: 6, rate: 0.78, label: '06:00' },
  { hour: 7, rate: 1.10, label: '07:00' },
  { hour: 8, rate: 1.35, label: '08:00' },
  { hour: 9, rate: 1.28, label: '09:00' },
  { hour: 10, rate: 1.15, label: '10:00' },
  { hour: 11, rate: 1.08, label: '11:00' },
  { hour: 12, rate: 0.95, label: '12:00' },
  { hour: 13, rate: 0.88, label: '13:00' },
  { hour: 14, rate: 0.72, label: '14:00' },
  { hour: 15, rate: 0.82, label: '15:00' },
  { hour: 16, rate: 1.05, label: '16:00' },
  { hour: 17, rate: 1.42, label: '17:00' },
  { hour: 18, rate: 1.55, label: '18:00' },
  { hour: 19, rate: 1.48, label: '19:00' },
  { hour: 20, rate: 1.25, label: '20:00' },
  { hour: 21, rate: 0.98, label: '21:00' },
  { hour: 22, rate: 0.68, label: '22:00' },
  { hour: 23, rate: 0.55, label: '23:00' },
];

const G11_RATE = 1.15;

interface Props {
  cycleKwh: number; // kWh per single use/cycle
  deviceName: string;
}

interface ChartClickPayload {
  payload: {
    hour: number;
  };
}

interface ChartClickState {
  activePayload?: ChartClickPayload[];
}

const DynamicTariffChart = ({ cycleKwh, deviceName }: Props) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const selected = selectedHour !== null ? MOCK_DYNAMIC_DAY[selectedHour] : null;
  const costAtSelected = selected ? cycleKwh * selected.rate : null;
  const costG11 = cycleKwh * G11_RATE;

  const cheapestHour = MOCK_DYNAMIC_DAY.reduce((min, h) => (h.rate < min.rate ? h : min), MOCK_DYNAMIC_DAY[0]);
  const expensiveHour = MOCK_DYNAMIC_DAY.reduce((max, h) => (h.rate > max.rate ? h : max), MOCK_DYNAMIC_DAY[0]);

  const cheapestCost = cycleKwh * cheapestHour.rate;
  const expensiveCost = cycleKwh * expensiveHour.rate;

  const handleClick = (data?: ChartClickState) => {
    if (data?.activePayload?.[0]) {
      setSelectedHour(data.activePayload[0].payload.hour);
    }
  };

  return (
    <div className="rounded-2xl border border-tauron/20 bg-gradient-to-br from-card to-tauron/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-tauron" />
        <h3 className="font-semibold font-display text-foreground">Taryfa Dynamiczna — Symulacja 24h</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Kliknij dowolną godzinę, aby zobaczyć koszt uruchomienia „{deviceName}" w tej chwili.
      </p>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_DYNAMIC_DAY} onClick={handleClick} className="cursor-pointer">
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(330 100% 44%)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(330 100% 44%)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              interval={3}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${v.toFixed(2)}`}
              className="fill-muted-foreground"
              width={45}
              label={{ value: 'zł/kWh', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)} zł/kWh`, 'Stawka']}
              labelFormatter={(label) => `Godzina: ${label}`}
              contentStyle={{ borderRadius: '0.75rem', fontSize: '0.75rem' }}
            />
            <ReferenceLine y={G11_RATE} stroke="hsl(220 10% 46%)" strokeDasharray="6 3" label={{ value: 'G11', position: 'right', style: { fontSize: 10 } }} />
            {selectedHour !== null && (
              <ReferenceLine x={MOCK_DYNAMIC_DAY[selectedHour].label} stroke="hsl(330 100% 44%)" strokeWidth={2} />
            )}
            <Area
              type="monotone"
              dataKey="rate"
              stroke="hsl(330 100% 44%)"
              strokeWidth={2}
              fill="url(#rateGradient)"
              dot={false}
              activeDot={{ r: 6, fill: 'hsl(330 100% 44%)', stroke: 'white', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Extremes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center cursor-pointer hover:bg-green-500/20 transition-colors"
             onClick={() => setSelectedHour(cheapestHour.hour)}>
          <TrendingDown className="h-4 w-4 mx-auto mb-1 text-green-600" />
          <p className="text-xs text-muted-foreground">Najtańsza godzina</p>
          <p className="font-bold text-green-600">{cheapestHour.label}</p>
          <p className="text-xs text-muted-foreground">{formatPln(cheapestCost)} zł/cykl</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center cursor-pointer hover:bg-red-500/20 transition-colors"
             onClick={() => setSelectedHour(expensiveHour.hour)}>
          <Clock className="h-4 w-4 mx-auto mb-1 text-red-500" />
          <p className="text-xs text-muted-foreground">Najdroższa godzina</p>
          <p className="font-bold text-red-500">{expensiveHour.label}</p>
          <p className="text-xs text-muted-foreground">{formatPln(expensiveCost)} zł/cykl</p>
        </div>
      </div>

      {/* Selected hour message */}
      {selected && costAtSelected !== null && (
        <motion.div
          key={selectedHour}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-tauron/30 rounded-xl p-4 text-center space-y-1"
        >
          <p className="text-sm font-medium text-foreground">
            ⚡ Uruchamiając <span className="font-bold">{deviceName}</span> o{' '}
            <span className="text-tauron font-bold">{selected.label}</span> (Taryfa Dynamiczna):
          </p>
          <p className="text-2xl font-black font-display text-tauron">
            {formatPln(costAtSelected)} zł
          </p>
          <p className="text-xs text-muted-foreground">
            vs. {formatPln(costG11)} zł w taryfie G11 —{' '}
            {costAtSelected < costG11 ? (
              <span className="text-green-600 font-semibold">
                oszczędzasz {formatPln(costG11 - costAtSelected)} zł ({Math.round(((costG11 - costAtSelected) / costG11) * 100)}%)
              </span>
            ) : (
              <span className="text-red-500 font-semibold">
                dopłacasz {formatPln(costAtSelected - costG11)} zł
              </span>
            )}
          </p>
        </motion.div>
      )}

      {/* Savings summary */}
      <div className="bg-muted/40 rounded-xl p-3 text-center">
        <p className="text-xs text-muted-foreground mb-1">Potencjalna roczna oszczędność (najtańsza godzina vs G11)</p>
        <p className="text-lg font-bold text-green-600">
          {formatPln((costG11 - cheapestCost) * 52 * 4)} zł/rok
        </p>
        <p className="text-xs text-muted-foreground">przy 4 cyklach/tydzień</p>
      </div>
    </div>
  );
};

export default DynamicTariffChart;
