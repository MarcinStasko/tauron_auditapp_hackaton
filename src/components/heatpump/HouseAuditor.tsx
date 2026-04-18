import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ImagePlus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import HeatPumpResult from './HeatPumpResult';

export interface DetailedHouseAnalysis {
  building_type: string;
  construction_year_estimate: number;
  floors: number;
  estimated_sqm: number;
  total_heated_area: number;
  insulation_status: 'Poor' | 'Average' | 'Good';
  wall_insulation: { quality: string; details: string };
  windows: { quality: string; type: string; details: string };
  roof: { quality: string; material: string; details: string };
  heating_clues: { chimney_type: string; existing_systems: string[]; notes: string };
  solar_potential: {
    roof_orientation: string;
    roof_angle_deg: number;
    available_area_sqm: number;
    shading_issues: string;
    recommended_pv_kwp: number;
  };
  thermal_bridges: string[];
  moisture_issues: string;
  air_tightness: 'Poor' | 'Average' | 'Good';
  energy_class_estimate: string;
  heat_demand_w_per_m2: number;
  recommended_improvements: string[];
  overall_summary: string;
  priority_actions: { action: string; estimated_cost_pln: number; energy_saving_percent: number }[];
  heating_cost_comparison: {
    gas_annual_pln: number;
    coal_annual_pln: number;
    heat_pump_annual_pln: number;
    electric_annual_pln: number;
  };
  geometry?: {
    estimated_volume_m3: number;
    av_ratio: number;
    compactness: 'compact' | 'moderate' | 'complex';
    wall_material: string;
    wall_thickness_cm: number;
    wwr_percent: number;
  };
  risk_flags?: {
    asbestos_suspected: boolean;
    asbestos_confidence: number;
    structural_cracks: boolean;
    cracks_description: string;
    missing_damp_course: boolean;
    missing_flashings: boolean;
    heat_pump_placement_suggestion: string;
  };
  heat_loss_distribution?: {
    walls_percent: number;
    roof_percent: number;
    windows_percent: number;
    floor_percent: number;
    ventilation_percent: number;
    thermal_bridges_percent: number;
  };
  confidence_scores?: {
    overall: number;
    envelope: number;
    geometry: number;
    solar: number;
  };
}

interface PhotoEntry {
  id: string;
  file: File;
  preview: string;
  base64: string;
  label: string;
}

const PHOTO_LABELS = [
  { id: 'front', label: 'Przód budynku', icon: '🏠' },
  { id: 'back', label: 'Tył budynku', icon: '🔙' },
  { id: 'left', label: 'Strona lewa', icon: '◀️' },
  { id: 'right', label: 'Strona prawa', icon: '▶️' },
  { id: 'roof', label: 'Dach / z góry', icon: '🏗️' },
  { id: 'detail', label: 'Detal (okna, ściany)', icon: '🔍' },
] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const HouseAuditor = () => {
  const [analysis, setAnalysis] = useState<DetailedHouseAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loadingProgress, setLoadingProgress] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<string>('front');

  const addPhoto = (file: File, slotId: string) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const label = PHOTO_LABELS.find((entry) => entry.id === slotId)?.label ?? slotId;

      setPhotos((previous) => {
        const filtered = previous.filter((entry) => entry.id !== slotId);
        return [...filtered, { id: slotId, file, preview: dataUrl, base64, label }];
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addPhoto(file, activeSlotRef.current);
    if (inputRef.current) inputRef.current.value = '';
  };

  const openFileFor = (slotId: string) => {
    activeSlotRef.current = slotId;
    inputRef.current?.click();
  };

  const removePhoto = (id: string) => {
    setPhotos((previous) => previous.filter((entry) => entry.id !== id));
  };

  const handleAnalyze = async () => {
    if (photos.length === 0) {
      toast.error('Dodaj przynajmniej jedno zdjęcie');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setLoadingProgress('Przesyłanie zdjęć...');

    try {
      const images = photos.map((photo) => ({
        base64: photo.base64,
        mimeType: photo.file.type,
        label: photo.label,
      }));

      setLoadingProgress(`Analiza ${photos.length} zdjęć przez AI...`);

      const { data, error } = await supabase.functions.invoke('analyze-house', {
        body: { images },
      });

      if (error) throw error;
      if (!data?.estimated_sqm) throw new Error('Brak danych z analizy');

      setAnalysis(data);
    } catch (error) {
      console.error(error);
      toast.error(getErrorMessage(error, 'Nie udało się przeanalizować zdjęć. Spróbuj ponownie.'));
    } finally {
      setLoading(false);
      setLoadingProgress('');
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setPhotos([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (analysis) {
    return (
      <HeatPumpResult
        analysis={analysis}
        previews={photos.map((photo) => photo.preview)}
        labeledPhotos={photos.map((photo) => ({ label: photo.label, preview: photo.preview }))}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold font-display text-foreground">Szczegółowy Audyt Energetyczny</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Dodaj zdjęcia budynku z różnych stron. Im więcej zdjęć, tym dokładniejsza analiza izolacji, okien, dachu i potencjału solarnego.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {loading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-8">
          <div className="flex gap-2 justify-center flex-wrap">
            {photos.map((photo) => (
              <img key={photo.id} src={photo.preview} alt={photo.label} className="w-16 h-16 object-cover rounded-xl border border-border" />
            ))}
          </div>
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-tauron animate-spin" />
            <p className="text-sm text-muted-foreground">{loadingProgress}</p>
            <p className="text-xs text-muted-foreground">
              Analizuję ściany, okna, dach, izolację i potencjał PV z {photos.length} zdjęć...
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PHOTO_LABELS.map((slot) => {
              const photo = photos.find((entry) => entry.id === slot.id);
              return (
                <motion.div
                  key={slot.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative rounded-2xl border-2 transition-all overflow-hidden aspect-[4/3] ${
                    photo
                      ? 'border-tauron/40 bg-card'
                      : 'border-dashed border-border hover:border-tauron/30 hover:bg-tauron/5 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!photo) openFileFor(slot.id);
                  }}
                >
                  {photo ? (
                    <>
                      <img src={photo.preview} alt={slot.label} className="w-full h-full object-cover" />
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          removePhoto(slot.id);
                        }}
                        className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full p-1 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                        <p className="text-[10px] text-white font-medium">{slot.icon} {slot.label}</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1.5 p-3">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground text-center">{slot.icon} {slot.label}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground">
              {photos.length === 0
                ? 'Dodaj przynajmniej 1 zdjęcie (zalecane 3+)'
                : `${photos.length} / 6 zdjęć dodanych`}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index <= photos.length ? 'bg-tauron' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {photos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-foreground">Szacowana dokładność audytu</p>
                <p className="text-xs font-bold text-tauron">
                  {photos.length === 1 ? '~40%' : photos.length === 2 ? '~60%' : photos.length === 3 ? '~75%' : photos.length >= 4 ? '~90%' : '~95%'}
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-tauron/60 to-tauron rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(95, photos.length * 18 + 10)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {photos.length < 3
                  ? 'Dodaj więcej zdjęć z różnych stron dla lepszej analizy'
                  : 'Dobra ilość zdjęć do precyzyjnej analizy'}
              </p>
            </motion.div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={photos.length === 0}
            className="w-full h-14 text-base font-bold gap-3 bg-tauron hover:bg-tauron/90 text-tauron-foreground rounded-2xl disabled:opacity-40"
          >
            <ArrowRight className="h-5 w-5" />
            Rozpocznij audyt AI ({photos.length} {photos.length === 1 ? 'zdjęcie' : 'zdjęć'})
          </Button>
        </div>
      )}
    </div>
  );
};

export default HouseAuditor;
