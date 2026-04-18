import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, Upload } from 'lucide-react';
import type { EnergyData } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onResult: (data: EnergyData) => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

const PhotoUploader = ({ onResult }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';

      setPreview(dataUrl);

      try {
        const { data, error: functionError } = await supabase.functions.invoke('analyze-label', {
          body: { image: base64, mimeType },
        });

        if (functionError) throw new Error(functionError.message);
        if (data?.error) throw new Error(data.error);

        onResult(data as EnergyData);
      } catch (error) {
        setError(getErrorMessage(error, 'Nie udało się przeanalizować etykiety.'));
        setPreview(null);
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  }, [onResult]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-tauron/30 bg-tauron/5"
          >
            <Loader2 className="h-10 w-10 text-tauron animate-spin" />
            <p className="text-sm text-muted-foreground text-center font-medium">
              Sztuczna inteligencja analizuje etykietę...
            </p>
            {preview && (
              <img src={preview} alt="Podgląd" className="w-24 h-24 object-cover rounded-lg opacity-60" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={(event) => event.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="group cursor-pointer flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed border-muted-foreground/25 hover:border-tauron/50 transition-colors bg-card"
          >
            <div className="bg-tauron/10 p-4 rounded-full group-hover:bg-tauron/20 transition-colors">
              <Camera className="h-8 w-8 text-tauron" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Zrób zdjęcie etykiety energetycznej</p>
              <p className="text-sm text-muted-foreground mt-1">lub przeciągnij i upuść zdjęcie tutaj</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Upload className="h-3.5 w-3.5" />
              <span>JPG, PNG, HEIC</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = '';
        }}
      />

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-destructive text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default PhotoUploader;
