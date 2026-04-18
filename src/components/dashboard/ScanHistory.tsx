import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Trash2, ChevronRight, X } from 'lucide-react';
import { ENERGY_CLASS_BADGE_COLORS } from '@/lib/constants';
import type { EnergyData } from '@/lib/types';
import type { ScanHistoryEntry } from '@/lib/scan-history';
import { removeFromHistory, clearHistory } from '@/lib/scan-history';
import { Button } from '@/components/ui/button';

interface Props {
  history: ScanHistoryEntry[];
  onSelect: (data: EnergyData) => void;
  onHistoryChange: () => void;
}

const ScanHistory = ({ history, onSelect, onHistoryChange }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    onHistoryChange();
  };

  const handleClear = () => {
    clearHistory();
    onHistoryChange();
    setExpanded(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
      >
        <History className="h-4 w-4" />
        <span>Historia skanowań ({history.length})</span>
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {history.map((entry) => {
                const badge = ENERGY_CLASS_BADGE_COLORS[entry.data.energy_class] ?? 'bg-muted text-muted-foreground';
                return (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onSelect(entry.data)}
                    className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-tauron/40 transition-colors text-left group"
                  >
                    <div className={`${badge} text-sm font-black px-2 py-1 rounded-lg min-w-[2.5rem] text-center`}>
                      {entry.data.energy_class}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{entry.data.device_type}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.scannedAt)}</p>
                    </div>
                    <div
                      role="button"
                      onClick={(e) => handleRemove(entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </div>
                  </motion.button>
                );
              })}

              <Button variant="ghost" size="sm" onClick={handleClear} className="w-full gap-2 text-muted-foreground">
                <Trash2 className="h-3.5 w-3.5" />
                Wyczyść historię
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScanHistory;
