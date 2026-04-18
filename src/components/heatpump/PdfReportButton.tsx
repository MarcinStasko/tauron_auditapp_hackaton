import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { DetailedHouseAnalysis } from './HouseAuditor';

interface Props {
  analysis: DetailedHouseAnalysis;
  previews: string[];
  recommendedKw: number;
  installCost: number;
  subsidyAmount: number;
  subsidyPercent: number;
  netCost: number;
  netRoiYears: number;
  annualSavings: number;
  annualGasHeatingCost: number;
  annualHeatPumpCost: number;
  annualCoalCost: number;
  annualElectricCost: number;
  co2Saved: number;
  area: number;
  wPerM2: number;
  demandKw: number;
}

const INSULATION_PL: Record<string, string> = { Poor: 'Słaba', Average: 'Średnia', Good: 'Dobra' };
const AIRTIGHT_PL: Record<string, string> = { Poor: 'Nieszczelny', Average: 'Średni', Good: 'Szczelny' };

const PdfReportButton = (props: Props) => {
  const [generating, setGenerating] = useState(false);

  const generatePdf = async () => {
    setGenerating(true);
    try {
      const {
        analysis, previews, recommendedKw, installCost, subsidyAmount, subsidyPercent,
        netCost, netRoiYears, annualSavings, annualGasHeatingCost, annualHeatPumpCost,
        annualCoalCost, annualElectricCost, co2Saved, area, wPerM2, demandKw,
      } = props;

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      let y = margin;

      const checkPage = (need: number) => {
        if (y + need > pageH - margin) {
          doc.addPage();
          y = margin;
        }
      };

      const sectionTitle = (text: string) => {
        checkPage(12);
        doc.setFillColor(255, 102, 0);
        doc.rect(margin, y, pageW - margin * 2, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(text, margin + 3, y + 5.5);
        y += 12;
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
      };

      const kv = (label: string, value: string) => {
        checkPage(6);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(label + ':', margin, y);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(value, pageW - margin * 2 - 50);
        doc.text(lines, margin + 50, y);
        y += 5 * lines.length + 1;
      };

      const paragraph = (text: string) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(text, pageW - margin * 2);
        for (const line of lines) {
          checkPage(5);
          doc.text(line, margin, y);
          y += 4.5;
        }
        y += 2;
      };

      // ===== HEADER =====
      doc.setFillColor(255, 102, 0);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RAPORT AUDYTU ENERGETYCZNEGO', margin, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Tauron · Analiza AI · Plan modernizacji', margin, 20);
      doc.setFontSize(8);
      doc.text(new Date().toLocaleDateString('pl-PL', { day: '2-digit', month: 'long', year: 'numeric' }), pageW - margin, 20, { align: 'right' });
      y = 36;
      doc.setTextColor(30, 30, 30);

      // ===== BUILDING PHOTO =====
      if (previews.length > 0) {
        try {
          doc.addImage(previews[0], 'JPEG', margin, y, 60, 45);
        } catch {/* ignore */}
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(analysis.building_type, margin + 65, y + 7);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Rok budowy: ~${analysis.construction_year_estimate}`, margin + 65, y + 14);
        doc.text(`Powierzchnia: ${area} m²`, margin + 65, y + 20);
        doc.text(`Liczba pięter: ${analysis.floors}`, margin + 65, y + 26);
        doc.text(`Klasa energetyczna: ${analysis.energy_class_estimate}`, margin + 65, y + 32);
        doc.text(`Liczba zdjęć w analizie: ${previews.length}`, margin + 65, y + 38);
        y += 50;
      }

      // ===== SUMMARY =====
      if (analysis.overall_summary) {
        sectionTitle('PODSUMOWANIE EKSPERCKIE');
        paragraph(analysis.overall_summary);
      }

      // ===== ENVELOPE =====
      sectionTitle('OBUDOWA BUDYNKU');
      kv('Ściany', `${INSULATION_PL[analysis.wall_insulation.quality] ?? analysis.wall_insulation.quality} — ${analysis.wall_insulation.details}`);
      kv('Okna', `${analysis.windows.type} (${INSULATION_PL[analysis.windows.quality] ?? analysis.windows.quality}) — ${analysis.windows.details}`);
      kv('Dach', `${analysis.roof.material} (${INSULATION_PL[analysis.roof.quality] ?? analysis.roof.quality}) — ${analysis.roof.details}`);
      kv('Szczelność', AIRTIGHT_PL[analysis.air_tightness] ?? analysis.air_tightness);
      if (analysis.thermal_bridges?.length > 0) {
        kv('Mostki termiczne', analysis.thermal_bridges.join(', '));
      }
      if (analysis.moisture_issues && analysis.moisture_issues !== 'None') {
        kv('Wilgoć', analysis.moisture_issues);
      }

      // ===== HEATING =====
      sectionTitle('SYSTEM GRZEWCZY');
      kv('Komin', analysis.heating_clues.chimney_type);
      kv('Istniejące systemy', analysis.heating_clues.existing_systems.join(', ') || 'Brak danych');
      kv('Zapotrzebowanie cieplne', `${wPerM2} W/m² × ${area} m² = ${demandKw.toFixed(1)} kW`);
      kv('Rekomendowana pompa', `${recommendedKw} kW (powietrze-woda, COP ~3.5, klasa A+++)`);
      if (analysis.heating_clues.notes) paragraph(analysis.heating_clues.notes);

      // ===== SOLAR =====
      sectionTitle('POTENCJAŁ FOTOWOLTAICZNY');
      kv('Orientacja dachu', analysis.solar_potential.roof_orientation);
      kv('Kąt nachylenia', `${analysis.solar_potential.roof_angle_deg}°`);
      kv('Dostępna powierzchnia', `${analysis.solar_potential.available_area_sqm} m²`);
      kv('Rekomendowana instalacja', `${analysis.solar_potential.recommended_pv_kwp} kWp`);
      kv('Szacowana produkcja roczna', `${(analysis.solar_potential.recommended_pv_kwp * 1000).toFixed(0)} kWh`);
      if (analysis.solar_potential.shading_issues && analysis.solar_potential.shading_issues !== 'None') {
        kv('Zacienienie', analysis.solar_potential.shading_issues);
      }

      // ===== COSTS COMPARISON =====
      sectionTitle('PORÓWNANIE ROCZNYCH KOSZTÓW OGRZEWANIA');
      const max = Math.max(annualElectricCost, annualGasHeatingCost, annualCoalCost, annualHeatPumpCost);
      const sources = [
        { label: 'Prąd (grzejniki)', cost: annualElectricCost, color: [220, 38, 38] as const },
        { label: 'Gaz ziemny', cost: annualGasHeatingCost, color: [245, 158, 11] as const },
        { label: 'Węgiel', cost: annualCoalCost, color: [120, 113, 108] as const },
        { label: 'Pompa ciepła', cost: annualHeatPumpCost, color: [34, 197, 94] as const },
      ];
      const barW = pageW - margin * 2 - 60;
      for (const s of sources) {
        checkPage(8);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(s.label, margin, y + 4);
        doc.setFillColor(230, 230, 230);
        doc.rect(margin + 45, y, barW, 5, 'F');
        doc.setFillColor(s.color[0], s.color[1], s.color[2]);
        doc.rect(margin + 45, y, (s.cost / max) * barW, 5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.text(`${(s.cost / 1000).toFixed(1)}k zł`, pageW - margin, y + 4, { align: 'right' });
        y += 8;
      }
      y += 2;
      doc.setFillColor(220, 252, 231);
      doc.rect(margin, y, pageW - margin * 2, 14, 'F');
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Pompa ciepła oszczędza ${((1 - annualHeatPumpCost / annualGasHeatingCost) * 100).toFixed(0)}% rocznie vs gaz`, margin + 3, y + 6);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Roczna oszczędność: ${annualSavings.toFixed(0)} zł · CO₂ mniej: ${co2Saved.toFixed(1)} t/rok`, margin + 3, y + 11);
      doc.setTextColor(30, 30, 30);
      y += 18;

      // ===== FINANCIAL =====
      sectionTitle('ANALIZA FINANSOWA INWESTYCJI');
      kv('Koszt instalacji pompy', `${installCost.toLocaleString('pl-PL')} zł`);
      kv(`Dotacja "Czyste Powietrze" (${subsidyPercent}%)`, `-${subsidyAmount.toLocaleString('pl-PL')} zł`);
      kv('Koszt netto inwestycji', `${netCost.toLocaleString('pl-PL')} zł`);
      kv('Roczna oszczędność', `${annualSavings.toFixed(0)} zł`);
      kv('Zwrot inwestycji (ROI)', `${netRoiYears} lat`);
      kv('Redukcja CO₂', `${co2Saved.toFixed(1)} ton/rok`);

      // ===== MODERNIZATION PLAN =====
      doc.addPage();
      y = margin;
      doc.setFillColor(255, 102, 0);
      doc.rect(0, 0, pageW, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN MODERNIZACJI ETAPAMI', margin, 12);
      y = 26;
      doc.setTextColor(30, 30, 30);

      type Phase = { title: string; cost: number; subsidy: number; savings: string; priority: string; desc: string };
      const phases: Phase[] = [];

      if (analysis.wall_insulation.quality === 'Poor' || analysis.wall_insulation.quality === 'Average') {
        const cost = area * 280;
        phases.push({
          title: '1. Ocieplenie ścian zewnętrznych',
          cost, subsidy: cost * 0.5,
          savings: '25-35% redukcji strat ciepła',
          priority: 'WYSOKI',
          desc: `Styropian/wełna 15-20cm. Powierzchnia ścian: ~${Math.round(area * 1.4)} m². Obniży zapotrzebowanie z ${wPerM2} do ~${Math.round(wPerM2 * 0.7)} W/m².`,
        });
      }
      if (analysis.windows.quality === 'Poor' || analysis.windows.quality === 'Average') {
        const cost = 18000;
        phases.push({
          title: '2. Wymiana okien na trzyszybowe',
          cost, subsidy: cost * 0.4,
          savings: '10-15% redukcji strat ciepła',
          priority: 'ŚREDNI',
          desc: 'Okna U≤0.9 W/m²K, ciepły montaż, redukcja mostków termicznych w ościeżnicach.',
        });
      }
      if (analysis.roof.quality === 'Poor' || analysis.roof.quality === 'Average') {
        const cost = area * 180;
        phases.push({
          title: '3. Ocieplenie dachu/stropu',
          cost, subsidy: cost * 0.5,
          savings: '15-20% redukcji strat ciepła',
          priority: 'WYSOKI',
          desc: 'Wełna mineralna 25-30cm. Najlepszy stosunek koszt/efekt energetyczny.',
        });
      }
      phases.push({
        title: `${phases.length + 1}. Montaż pompy ciepła ${recommendedKw} kW`,
        cost: installCost, subsidy: subsidyAmount,
        savings: `${((1 - annualHeatPumpCost / annualGasHeatingCost) * 100).toFixed(0)}% rocznych kosztów ogrzewania`,
        priority: 'KLUCZOWY',
        desc: `Pompa powietrze-woda klasy A+++, COP ~3.5. Po wcześniejszej termomodernizacji efektywność wzrasta o 20-30%.`,
      });
      if (analysis.solar_potential.recommended_pv_kwp >= 4) {
        const pvCost = analysis.solar_potential.recommended_pv_kwp * 5500;
        phases.push({
          title: `${phases.length + 1}. Instalacja PV ${analysis.solar_potential.recommended_pv_kwp} kWp`,
          cost: pvCost, subsidy: 6000,
          savings: `~${(analysis.solar_potential.recommended_pv_kwp * 1000).toFixed(0)} kWh/rok własnej energii`,
          priority: 'OPCJONALNY',
          desc: `Synergia z pompą ciepła. Orientacja: ${analysis.solar_potential.roof_orientation}, kąt: ${analysis.solar_potential.roof_angle_deg}°.`,
        });
      }
      phases.push({
        title: `${phases.length + 1}. Wentylacja mechaniczna z rekuperacją`,
        cost: 22000, subsidy: 5000,
        savings: '20-25% mniejsze straty wentylacyjne',
        priority: 'OPCJONALNY',
        desc: 'Rekuperator z odzyskiem ciepła 85-90%. Wymagane przy bardzo szczelnym budynku.',
      });

      let totalCost = 0, totalSubsidy = 0;
      for (const p of phases) {
        checkPage(40);
        doc.setFillColor(248, 248, 248);
        doc.rect(margin, y, pageW - margin * 2, 36, 'F');
        doc.setDrawColor(255, 102, 0);
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin, y + 36);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(p.title, margin + 4, y + 6);
        const prioColor: Record<string, [number, number, number]> = {
          KLUCZOWY: [220, 38, 38], WYSOKI: [245, 158, 11], ŚREDNI: [59, 130, 246], OPCJONALNY: [120, 113, 108],
        };
        const c = prioColor[p.priority] ?? [120, 113, 108];
        doc.setFillColor(c[0], c[1], c[2]);
        doc.roundedRect(pageW - margin - 28, y + 2, 24, 5, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(p.priority, pageW - margin - 16, y + 5.5, { align: 'center' });
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(p.desc, pageW - margin * 2 - 8);
        doc.text(descLines.slice(0, 3), margin + 4, y + 12);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(`Koszt: ${p.cost.toLocaleString('pl-PL')} zł`, margin + 4, y + 28);
        doc.setTextColor(34, 197, 94);
        doc.text(`Dotacja: -${p.subsidy.toLocaleString('pl-PL')} zł`, margin + 55, y + 28);
        doc.setTextColor(255, 102, 0);
        doc.text(`Netto: ${(p.cost - p.subsidy).toLocaleString('pl-PL')} zł`, margin + 110, y + 28);
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'italic');
        doc.text(`Efekt: ${p.savings}`, margin + 4, y + 33);
        y += 40;
        totalCost += p.cost;
        totalSubsidy += p.subsidy;
      }

      // ===== TOTALS =====
      checkPage(30);
      doc.setFillColor(255, 102, 0);
      doc.rect(margin, y, pageW - margin * 2, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CAŁKOWITY KOSZT MODERNIZACJI', margin + 4, y + 7);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Koszt brutto: ${totalCost.toLocaleString('pl-PL')} zł`, margin + 4, y + 13);
      doc.text(`Łączne dotacje: -${totalSubsidy.toLocaleString('pl-PL')} zł`, margin + 4, y + 18);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(`NETTO: ${(totalCost - totalSubsidy).toLocaleString('pl-PL')} zł`, pageW - margin - 4, y + 15, { align: 'right' });
      y += 30;

      // ===== FOOTER on every page =====
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text('Raport wygenerowany przez Tauron AI Energy Audit · dane szacunkowe', margin, pageH - 6);
        doc.text(`Strona ${i} / ${pageCount}`, pageW - margin, pageH - 6, { align: 'right' });
      }

      const fileName = `audyt-energetyczny-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast({ title: 'Raport wygenerowany', description: `Zapisano: ${fileName}` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Błąd', description: 'Nie udało się wygenerować raportu', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePdf}
      disabled={generating}
      variant="outline"
      className="w-full gap-2 print:hidden h-12 border-tauron/30 hover:bg-tauron/5"
    >
      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 text-tauron" />}
      {generating ? 'Generowanie raportu...' : 'Pobierz raport PDF'}
    </Button>
  );
};

export default PdfReportButton;
