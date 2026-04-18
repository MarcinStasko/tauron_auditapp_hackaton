import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatPln } from '@/lib/calculations';

interface Props {
  monthlyBreakdown: number[];
}

const MONTHS = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];

const MonthlyChart = ({ monthlyBreakdown }: Props) => {
  const data = monthlyBreakdown.map((val, i) => ({ name: MONTHS[i], koszt: Number(val.toFixed(2)) }));
  const max = Math.max(...monthlyBreakdown);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-3">
      <h3 className="font-semibold font-display text-foreground text-sm">📊 Szacunkowy koszt miesięczny (sezonowo)</h3>
      <p className="text-xs text-muted-foreground">Uwzględnia wyższe zużycie zimą i niższe latem</p>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip
              formatter={(value: number) => [`${formatPln(value)} zł`, 'Koszt']}
              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid hsl(var(--border))' }}
            />
            <Bar dataKey="koszt" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.koszt >= max * 0.95 ? 'hsl(var(--tauron))' : 'hsl(var(--muted-foreground) / 0.3)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyChart;
