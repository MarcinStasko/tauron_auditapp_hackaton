import { Layers } from 'lucide-react';
import type { DetailedHouseAnalysis } from './HouseAuditor';

interface Props {
  analysis: DetailedHouseAnalysis;
  area: number;
}

interface Row {
  element: string;
  area: number;
  uValue: number;
  quality: string;
  loss: number;
  upgradeCost: number;
}

const QUALITY_U: Record<string, Record<string, number>> = {
  walls: { Poor: 1.4, Average: 0.8, Good: 0.25 },
  windows: { Poor: 2.6, Average: 1.5, Good: 0.9 },
  roof: { Poor: 1.0, Average: 0.45, Good: 0.18 },
};

const EnvelopeInventory = ({ analysis, area }: Props) => {
  const wallArea = Math.round(area * 1.4);
  const roofArea = Math.round(area * 1.1);
  const wwr = analysis.geometry?.wwr_percent ?? 18;
  const windowArea = Math.round(wallArea * (wwr / 100));
  const floorArea = Math.round(area / (analysis.floors || 1));

  const wallU = QUALITY_U.walls[analysis.wall_insulation.quality] ?? 0.8;
  const winU = QUALITY_U.windows[analysis.windows.quality] ?? 1.5;
  const roofU = QUALITY_U.roof[analysis.roof.quality] ?? 0.45;
  const floorU = 0.5;

  const dT = 22; // delta T heating season
  const rows: Row[] = [
    {
      element: 'Ściany zewn.',
      area: wallArea - windowArea,
      uValue: wallU,
      quality: analysis.wall_insulation.quality,
      loss: ((wallArea - windowArea) * wallU * dT) / 1000,
      upgradeCost: (wallArea - windowArea) * 280,
    },
    {
      element: 'Okna',
      area: windowArea,
      uValue: winU,
      quality: analysis.windows.quality,
      loss: (windowArea * winU * dT) / 1000,
      upgradeCost: windowArea * 1200,
    },
    {
      element: 'Dach / strop',
      area: roofArea,
      uValue: roofU,
      quality: analysis.roof.quality,
      loss: (roofArea * roofU * dT) / 1000,
      upgradeCost: roofArea * 180,
    },
    {
      element: 'Podłoga',
      area: floorArea,
      uValue: floorU,
      quality: 'Average',
      loss: (floorArea * floorU * dT) / 1000,
      upgradeCost: floorArea * 220,
    },
  ];

  const totalLoss = rows.reduce((s, r) => s + r.loss, 0);
  const totalCost = rows.reduce((s, r) => s + r.upgradeCost, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-tauron" />
        <h4 className="text-sm font-bold text-foreground">Inwentaryzacja przegród</h4>
      </div>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 font-medium">Element</th>
              <th className="text-right py-2 font-medium">m²</th>
              <th className="text-right py-2 font-medium">U</th>
              <th className="text-right py-2 font-medium">Strata</th>
              <th className="text-right py-2 font-medium">Koszt term.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = (r.loss / totalLoss) * 100;
              return (
                <tr key={r.element} className="border-b border-border/50">
                  <td className="py-2 text-foreground font-medium">{r.element}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.area}</td>
                  <td className="py-2 text-right text-muted-foreground">{r.uValue.toFixed(2)}</td>
                  <td className="py-2 text-right">
                    <span className="text-foreground font-semibold">{r.loss.toFixed(1)} kW</span>
                    <span className="text-muted-foreground ml-1">({pct.toFixed(0)}%)</span>
                  </td>
                  <td className="py-2 text-right text-tauron font-medium">
                    {(r.upgradeCost / 1000).toFixed(0)}k zł
                  </td>
                </tr>
              );
            })}
            <tr className="font-bold">
              <td className="py-2 text-foreground">Suma</td>
              <td className="py-2 text-right text-foreground">—</td>
              <td className="py-2 text-right text-foreground">—</td>
              <td className="py-2 text-right text-foreground">{totalLoss.toFixed(1)} kW</td>
              <td className="py-2 text-right text-tauron">{(totalCost / 1000).toFixed(0)}k zł</td>
            </tr>
          </tbody>
        </table>
      </div>

      {analysis.geometry && (
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Kubatura</p>
            <p className="text-sm font-bold text-foreground">{analysis.geometry.estimated_volume_m3} m³</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">A/V</p>
            <p className="text-sm font-bold text-foreground">{analysis.geometry.av_ratio?.toFixed(2)}</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">WWR okien</p>
            <p className="text-sm font-bold text-foreground">{wwr}%</p>
          </div>
        </div>
      )}

      {analysis.geometry?.wall_material && (
        <div className="bg-muted/20 border border-border rounded-lg p-2.5 text-xs">
          <span className="text-muted-foreground">Materiał ścian: </span>
          <span className="text-foreground font-medium">{analysis.geometry.wall_material}</span>
          {analysis.geometry.wall_thickness_cm > 0 && (
            <span className="text-muted-foreground"> · grubość ~{analysis.geometry.wall_thickness_cm} cm</span>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvelopeInventory;
