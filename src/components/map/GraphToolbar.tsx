import { Plus, Trash2, Link, Unlink, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ToolMode = 'select' | 'link' | 'unlink' | 'delete';

interface GraphToolbarProps {
  mode: ToolMode;
  onModeChange: (m: ToolMode) => void;
  onAddNode: () => void;
  onReset: () => void;
  linkSource: string | null;
}

const GraphToolbar = ({ mode, onModeChange, onAddNode, onReset, linkSource }: GraphToolbarProps) => {
  const btn = (m: ToolMode, icon: React.ReactNode, label: string) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={mode === m ? 'default' : 'outline'}
          size="icon"
          className="h-8 w-8"
          onClick={() => onModeChange(mode === m ? 'select' : m)}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-xl p-1.5 shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onAddNode}>
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p className="text-xs">Dodaj węzeł</p></TooltipContent>
        </Tooltip>

        <div className="w-px bg-border" />

        {btn('link', <Link className="h-4 w-4" />, linkSource ? 'Kliknij cel połączenia' : 'Połącz węzły')}
        {btn('unlink', <Unlink className="h-4 w-4" />, 'Rozłącz węzły')}
        {btn('delete', <Trash2 className="h-4 w-4" />, 'Usuń węzeł')}

        <div className="w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p className="text-xs">Resetuj sieć</p></TooltipContent>
        </Tooltip>
      </div>

      {/* Mode indicator */}
      {mode !== 'select' && (
        <div className="absolute top-14 left-3 z-10 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-lg shadow-lg font-medium">
          {mode === 'link' && (linkSource ? '🔗 Kliknij drugi węzeł' : '🔗 Kliknij pierwszy węzeł')}
          {mode === 'unlink' && '✂️ Kliknij węzeł, aby odłączyć'}
          {mode === 'delete' && '🗑️ Kliknij węzeł, aby usunąć'}
        </div>
      )}
    </TooltipProvider>
  );
};

export default GraphToolbar;
