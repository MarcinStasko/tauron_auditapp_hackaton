import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  type InstallationType,
  INSTALLATION_LABELS,
  INSTALLATION_ICONS,
} from '@/lib/graph-types';

interface AddNodeDialogProps {
  onAdd: (type: InstallationType, name: string) => void;
  onClose: () => void;
}

const TYPES: InstallationType[] = ['house', 'business', 'estate', 'transformer', 'solar_farm'];

const AddNodeDialog = ({ onAdd, onClose }: AddNodeDialogProps) => {
  const [selectedType, setSelectedType] = useState<InstallationType>('house');
  const [name, setName] = useState('');

  const handleSubmit = () => {
    const finalName = name.trim() || `${INSTALLATION_LABELS[selectedType]} ${Math.floor(Math.random() * 100)}`;
    onAdd(selectedType, finalName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] w-[320px] bg-card border border-border rounded-2xl shadow-2xl p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-bold font-display text-foreground text-sm">Dodaj węzeł</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Typ instalacji</Label>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-colors ${
                selectedType === t
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:bg-muted text-muted-foreground'
              }`}
            >
              <span>{INSTALLATION_ICONS[t]}</span>
              <span>{INSTALLATION_LABELS[t]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Nazwa (opcjonalna)</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={INSTALLATION_LABELS[selectedType]}
          className="text-sm"
        />
      </div>

      <Button onClick={handleSubmit} className="w-full gap-2">
        <Plus className="h-4 w-4" />
        Dodaj do sieci
      </Button>
    </motion.div>
  );
};

export default AddNodeDialog;
