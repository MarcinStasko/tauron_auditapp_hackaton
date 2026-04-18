import { Plug, Lightbulb } from 'lucide-react';
import { formatPln } from '@/lib/calculations';

interface Props {
  standby: { annualKwh: number; annualCost: number };
  enabled: boolean;
}

const StandbyCard = ({ standby, enabled }: Props) => {
  if (standby.annualKwh <= 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Plug className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-foreground">Koszt czuwania (standby)</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Urządzenie w trybie czuwania zużywa ok. {standby.annualKwh.toFixed(1)} kWh rocznie
      </p>
      <p className="text-sm font-medium text-foreground">
        {enabled ? (
          <>Dodatkowy koszt: <span className="text-tauron">{formatPln(standby.annualCost)} zł/rok</span></>
        ) : (
          <span className="text-green-600">✓ Standby wyłączony — oszczędzasz {formatPln(standby.annualCost)} zł/rok</span>
        )}
      </p>
      {enabled && (
        <div className="flex items-start gap-2 mt-2 bg-muted/40 rounded-lg p-3">
          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Odłączając urządzenie od prądu, zaoszczędzisz {formatPln(standby.annualCost)} zł/rok.
            W skali 10 urządzeń to {formatPln(standby.annualCost * 10)} zł!
          </p>
        </div>
      )}
    </div>
  );
};

export default StandbyCard;
