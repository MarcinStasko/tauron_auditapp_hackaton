import { AlertTriangle, AlertOctagon, CheckCircle2, MapPin, type LucideIcon } from 'lucide-react';
import type { DetailedHouseAnalysis } from './HouseAuditor';

interface Props {
  analysis: DetailedHouseAnalysis;
}

const RiskFlags = ({ analysis }: Props) => {
  const r = analysis.risk_flags;

  if (!r) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground p-3">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        Brak danych o ryzykach — analizuj więcej zdjęć dla dokładniejszej oceny.
      </div>
    );
  }

  const risks: { icon: LucideIcon; level: 'critical' | 'warning' | 'info'; title: string; description: string }[] = [];

  if (r.asbestos_suspected) {
    risks.push({
      icon: AlertOctagon,
      level: 'critical',
      title: '⚠️ Podejrzenie azbestu (eternit)',
      description: `Pewność: ${r.asbestos_confidence ?? 0}%. Wymaga ekspertyzy laboratoryjnej. Utylizacja objęta dotacją do 100% kosztów (Program Oczyszczania Kraju z Azbestu do 2032 r.).`,
    });
  }
  if (r.structural_cracks) {
    risks.push({
      icon: AlertTriangle,
      level: 'warning',
      title: 'Pęknięcia konstrukcyjne',
      description: r.cracks_description || 'Widoczne spękania — przed termomodernizacją wymagana ekspertyza konstruktora.',
    });
  }
  if (r.missing_damp_course) {
    risks.push({
      icon: AlertTriangle,
      level: 'warning',
      title: 'Brak izolacji przeciwwilgociowej',
      description: 'Cokół bez widocznej izolacji poziomej — ryzyko podciągania kapilarnego wilgoci.',
    });
  }
  if (r.missing_flashings) {
    risks.push({
      icon: AlertTriangle,
      level: 'info',
      title: 'Braki w obróbkach blacharskich',
      description: 'Uzupełnienie rynien/parapetów przed ociepleniem elewacji.',
    });
  }

  return (
    <div className="space-y-3">
      {risks.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-1" />
          <p className="text-sm font-medium text-foreground">Brak krytycznych ryzyk</p>
          <p className="text-xs text-muted-foreground mt-1">AI nie wykryła oczywistych zagrożeń na dostarczonych zdjęciach.</p>
        </div>
      )}

      {risks.map((risk, i) => {
        const Icon = risk.icon;
        const styles = {
          critical: 'bg-red-500/10 border-red-500/30 text-red-500',
          warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
          info: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
        }[risk.level];
        return (
          <div key={i} className={`border rounded-xl p-3 ${styles}`}>
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold">{risk.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{risk.description}</p>
              </div>
            </div>
          </div>
        );
      })}

      {r.heat_pump_placement_suggestion && (
        <div className="bg-tauron/5 border border-tauron/20 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-tauron flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">Sugerowane miejsce jednostki zewn. pompy</p>
              <p className="text-xs text-muted-foreground mt-1">{r.heat_pump_placement_suggestion}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskFlags;
