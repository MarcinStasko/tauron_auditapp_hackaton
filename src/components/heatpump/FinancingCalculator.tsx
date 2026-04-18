import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Wallet, Calculator, TrendingUp, Info } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

export interface FinanceableScenario {
  id: string;
  name: string;
  netCost: number;        // koszt po dotacji
  annualSavings: number;  // oszczędność roczna
  recommended?: boolean;
}

interface Props {
  scenarios: FinanceableScenario[];
}

type Mode = 'cash' | 'credit' | 'leasing';

interface FinanceParams {
  mode: Mode;
  downPaymentPct: number;  // % wkładu własnego
  termMonths: number;
  interestRate: number;    // % roczna
  residualPct: number;     // % wartości końcowej (leasing)
}

const DEFAULT_PARAMS: FinanceParams = {
  mode: 'credit',
  downPaymentPct: 10,
  termMonths: 120,
  interestRate: 8.5,
  residualPct: 1,
};

// Annuity formula
function calcMonthlyPayment(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return principal / months;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function calcLeasing(netCost: number, downPct: number, months: number, ratePct: number, residualPct: number) {
  const downPayment = netCost * (downPct / 100);
  const residual = netCost * (residualPct / 100);
  const financed = netCost - downPayment - residual;
  const monthly = calcMonthlyPayment(financed, ratePct, months);
  const totalCost = downPayment + monthly * months + residual;
  return { downPayment, monthly, residual, totalCost, totalInterest: totalCost - netCost };
}

function calcCredit(netCost: number, downPct: number, months: number, ratePct: number) {
  const downPayment = netCost * (downPct / 100);
  const financed = netCost - downPayment;
  const monthly = calcMonthlyPayment(financed, ratePct, months);
  const totalCost = downPayment + monthly * months;
  return { downPayment, monthly, residual: 0, totalCost, totalInterest: totalCost - netCost };
}

const FinancingCalculator = ({ scenarios }: Props) => {
  const [params, setParams] = useState<FinanceParams>(DEFAULT_PARAMS);
  const update = <K extends keyof FinanceParams>(k: K, v: FinanceParams[K]) =>
    setParams((p) => ({ ...p, [k]: v }));

  const rows = useMemo(() => {
    return scenarios.map((s) => {
      const monthlySavings = s.annualSavings / 12;
      let financing;
      if (params.mode === 'cash') {
        financing = { downPayment: s.netCost, monthly: 0, residual: 0, totalCost: s.netCost, totalInterest: 0 };
      } else if (params.mode === 'credit') {
        financing = calcCredit(s.netCost, params.downPaymentPct, params.termMonths, params.interestRate);
      } else {
        financing = calcLeasing(s.netCost, params.downPaymentPct, params.termMonths, params.interestRate, params.residualPct);
      }
      const netMonthly = financing.monthly - monthlySavings; // ile dopłacasz miesięcznie po oszczędnościach
      const breakEvenMonths = monthlySavings > 0 ? Math.ceil(s.netCost / monthlySavings) : Infinity;
      return { scenario: s, financing, monthlySavings, netMonthly, breakEvenMonths };
    });
  }, [scenarios, params]);

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {([
          { id: 'cash', label: 'Gotówka', icon: <Wallet className="h-3.5 w-3.5" /> },
          { id: 'credit', label: 'Kredyt', icon: <Banknote className="h-3.5 w-3.5" /> },
          { id: 'leasing', label: 'Leasing', icon: <Calculator className="h-3.5 w-3.5" /> },
        ] as const).map((m) => (
          <button
            key={m.id}
            onClick={() => update('mode', m.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2.5 transition-all',
              params.mode === m.id
                ? 'bg-tauron text-tauron-foreground shadow-sm'
                : 'bg-muted hover:bg-muted/70 text-muted-foreground'
            )}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      {params.mode !== 'cash' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-2xl border border-border bg-card p-4 space-y-4"
        >
          <SliderRow
            label="Wkład własny"
            value={`${params.downPaymentPct}%`}
            min={0}
            max={50}
            step={5}
            current={params.downPaymentPct}
            onChange={(v) => update('downPaymentPct', v)}
          />
          <SliderRow
            label="Okres spłaty"
            value={`${params.termMonths / 12} lat (${params.termMonths} mies.)`}
            min={24}
            max={240}
            step={12}
            current={params.termMonths}
            onChange={(v) => update('termMonths', v)}
          />
          <SliderRow
            label="Oprocentowanie roczne"
            value={`${params.interestRate.toFixed(1)}%`}
            min={0}
            max={20}
            step={0.5}
            current={params.interestRate}
            onChange={(v) => update('interestRate', v)}
          />
          {params.mode === 'leasing' && (
            <SliderRow
              label="Wartość końcowa (wykup)"
              value={`${params.residualPct}%`}
              min={1}
              max={30}
              step={1}
              current={params.residualPct}
              onChange={(v) => update('residualPct', v)}
            />
          )}
        </motion.div>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="text-left p-3 font-medium text-muted-foreground w-40">Parametr</th>
              {rows.map(({ scenario }) => (
                <th
                  key={scenario.id}
                  className={cn('text-left p-3 font-bold', scenario.recommended && 'bg-tauron/10')}
                >
                  <span className="text-foreground">{scenario.name}</span>
                  {scenario.recommended && (
                    <span className="ml-1.5 bg-tauron text-tauron-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      TOP
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <FinRow label="Koszt netto inwestycji" cells={rows.map((r) => `${r.scenario.netCost.toLocaleString('pl-PL')} zł`)} highlights={rows.map((r) => !!r.scenario.recommended)} />
            {params.mode !== 'cash' && (
              <FinRow
                label="Wkład własny"
                cells={rows.map((r) => `${r.financing.downPayment.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`)}
                highlights={rows.map((r) => !!r.scenario.recommended)}
              />
            )}
            {params.mode !== 'cash' && (
              <FinRow
                label="Rata miesięczna"
                cells={rows.map((r) => (
                  <span className="text-tauron font-bold text-sm">
                    {r.financing.monthly.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                  </span>
                ))}
                highlights={rows.map((r) => !!r.scenario.recommended)}
              />
            )}
            {params.mode === 'leasing' && (
              <FinRow
                label="Wykup końcowy"
                cells={rows.map((r) => `${r.financing.residual.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł`)}
                highlights={rows.map((r) => !!r.scenario.recommended)}
              />
            )}
            <FinRow
              label="Oszczędność miesięczna"
              cells={rows.map((r) => (
                <span className="text-green-600 font-medium">
                  +{r.monthlySavings.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                </span>
              ))}
              highlights={rows.map((r) => !!r.scenario.recommended)}
            />
            {params.mode !== 'cash' && (
              <FinRow
                label="Realny koszt mies. (rata − oszczęd.)"
                cells={rows.map((r) => (
                  <span className={cn('font-bold', r.netMonthly <= 0 ? 'text-green-600' : 'text-foreground')}>
                    {r.netMonthly <= 0 ? '✓ ' : ''}
                    {Math.abs(r.netMonthly).toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                    {r.netMonthly <= 0 ? ' zysku' : ''}
                  </span>
                ))}
                highlights={rows.map((r) => !!r.scenario.recommended)}
              />
            )}
            {params.mode !== 'cash' && (
              <FinRow
                label="Suma odsetek"
                cells={rows.map((r) => (
                  <span className="text-muted-foreground">
                    {r.financing.totalInterest.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                  </span>
                ))}
                highlights={rows.map((r) => !!r.scenario.recommended)}
              />
            )}
            <FinRow
              label="Całkowity koszt"
              cells={rows.map((r) => (
                <span className="text-foreground font-medium">
                  {r.financing.totalCost.toLocaleString('pl-PL', { maximumFractionDigits: 0 })} zł
                </span>
              ))}
              highlights={rows.map((r) => !!r.scenario.recommended)}
            />
            <FinRow
              label="Punkt zwrotu (BEP)"
              cells={rows.map((r) => (
                <span className="text-foreground">
                  {Number.isFinite(r.breakEvenMonths)
                    ? `${Math.floor(r.breakEvenMonths / 12)} lat ${r.breakEvenMonths % 12} mies.`
                    : '—'}
                </span>
              ))}
              highlights={rows.map((r) => !!r.scenario.recommended)}
            />
          </tbody>
        </table>
      </div>

      {/* Best deal highlight */}
      {params.mode !== 'cash' && rows.some((r) => r.netMonthly <= 0) && (
        <div className="rounded-2xl bg-gradient-to-br from-green-500/15 via-card to-green-500/5 border-2 border-green-500/30 p-4 flex items-start gap-3">
          <div className="bg-green-500 rounded-xl p-2 flex-shrink-0">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-green-600 uppercase tracking-wider font-bold">Inwestycja samofinansująca</p>
            <p className="text-sm font-bold text-foreground">
              {rows.filter((r) => r.netMonthly <= 0).length}{' '}
              {rows.filter((r) => r.netMonthly <= 0).length === 1 ? 'scenariusz spłaca się' : 'scenariusze spłacają się'}{' '}
              z samych oszczędności
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Miesięczna oszczędność na rachunkach przewyższa ratę kredytu — nie dopłacasz nic z portfela.
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-xl bg-muted/40 border border-border p-3">
        <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Wyliczenia szacunkowe (rata annuitetowa). Faktyczna oferta zależy od banku/leasingodawcy, scoringu BIK,
          ubezpieczenia i prowizji. Programy „Czyste Powietrze" i „Mój Prąd" mogą obniżyć koszt netto dodatkowo o 30-50%.
        </p>
      </div>
    </div>
  );
};

const SliderRow = ({
  label, value, min, max, step, current, onChange,
}: {
  label: string; value: string; min: number; max: number; step: number; current: number; onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xs font-bold text-tauron">{value}</p>
    </div>
    <Slider
      value={[current]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
      className="w-full"
    />
  </div>
);

const FinRow = ({ label, cells, highlights }: { label: string; cells: React.ReactNode[]; highlights: boolean[] }) => (
  <tr className="border-b border-border last:border-b-0">
    <td className="p-3 font-medium text-muted-foreground">{label}</td>
    {cells.map((c, i) => (
      <td key={i} className={cn('p-3 text-foreground', highlights[i] && 'bg-tauron/5')}>{c}</td>
    ))}
  </tr>
);

export default FinancingCalculator;
