import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, TreePine, Zap, Users } from 'lucide-react';
import { formatPln } from '@/lib/calculations';

const MACRO_FACTOR = 100_000; // households

interface Props {
  annualSavingsZl: number; // single household annual savings in PLN
  annualSavingsKwh: number; // single household annual savings in kWh
}

function useCountUp(target: number, duration: number = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) { setValue(0); return; }
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

const MacroImpact = ({ annualSavingsZl, annualSavingsKwh }: Props) => {
  const totalMwh = (annualSavingsKwh * MACRO_FACTOR) / 1000;
  const totalCo2Tons = (annualSavingsKwh * MACRO_FACTOR * 0.71) / 1000;
  const equivalentTrees = Math.round(totalCo2Tons * 5);
  const totalSavingsMillionZl = (annualSavingsZl * MACRO_FACTOR) / 1_000_000;

  const animMwh = useCountUp(totalMwh);
  const animCo2 = useCountUp(totalCo2Tons);
  const animTrees = useCountUp(equivalentTrees);
  const animZl = useCountUp(totalSavingsMillionZl);

  if (annualSavingsZl <= 0 && annualSavingsKwh <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-2xl border-2 border-tauron/30 bg-gradient-to-br from-tauron/10 via-card to-tauron/5 p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-tauron/20 flex items-center justify-center">
          <Globe className="h-5 w-5 text-tauron" />
        </div>
        <div>
          <h3 className="font-bold font-display text-foreground text-lg">Polska Oszczędza: Skala Makro</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            Gdyby {MACRO_FACTOR.toLocaleString('pl-PL')} gospodarstw zrobiło to samo…
          </p>
        </div>
      </div>

      {/* Scorecard */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          icon={<Zap className="h-5 w-5 text-tauron" />}
          label="Oszczędność Prądu"
          value={`${animMwh.toFixed(0)}`}
          unit="MWh/rok"
          bg="bg-tauron/10"
        />
        <ScoreCard
          icon={<TreePine className="h-5 w-5 text-green-600" />}
          label="Zmniejszona Emisja CO₂"
          value={`${animCo2.toFixed(0)}`}
          unit="Ton/rok"
          bg="bg-green-500/10"
        />
        <ScoreCard
          icon={<span className="text-xl">🌳</span>}
          label="Ekwiwalent Drzew"
          value={`${animTrees.toFixed(0)}`}
          unit="dorosłych dębów"
          bg="bg-emerald-500/10"
        />
        <ScoreCard
          icon={<span className="text-xl">💰</span>}
          label="Oszczędność Polska"
          value={`${animZl.toFixed(1)}`}
          unit="mln zł/rok"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Vision statement */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2 }}
        className="bg-card/80 backdrop-blur rounded-xl p-4 border border-tauron/20 text-center"
      >
        <p className="text-sm text-foreground font-medium">
          🇵🇱 <span className="font-display font-bold">Polska Wizja:</span>{' '}
          To tak, jakbyśmy zasilili całe miasto na {Math.max(1, Math.round(totalMwh / 50))} minut
          i posadzili <span className="text-green-600 font-bold">{equivalentTrees.toLocaleString('pl-PL')}</span> drzew.
        </p>
      </motion.div>
    </motion.div>
  );
};

function ScoreCard({ icon, label, value, unit, bg }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  bg: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`${bg} rounded-xl p-4 text-center space-y-1`}
    >
      <div className="flex justify-center">{icon}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-black font-display text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
    </motion.div>
  );
}

export default MacroImpact;
