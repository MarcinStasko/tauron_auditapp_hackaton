import { Play, Pause, Sun, Moon, Sunrise, Sunset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface SimulationBarProps {
  hour: number;
  playing: boolean;
  speed: number;
  onHourChange: (h: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (s: number) => void;
}

function hourIcon(hour: number) {
  if (hour >= 6 && hour < 10) return <Sunrise className="h-4 w-4 text-orange-400" />;
  if (hour >= 10 && hour < 17) return <Sun className="h-4 w-4 text-yellow-400" />;
  if (hour >= 17 && hour < 21) return <Sunset className="h-4 w-4 text-orange-500" />;
  return <Moon className="h-4 w-4 text-blue-300" />;
}

const SimulationBar = ({ hour, playing, speed, onHourChange, onTogglePlay, onSpeedChange }: SimulationBarProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hourIcon(hour)}
          <span className="font-display font-bold text-sm text-foreground">
            Symulacja dobowa
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Prędkość:</span>
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`text-xs px-1.5 py-0.5 rounded ${
                speed === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {s}x
            </button>
          ))}
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={onTogglePlay}>
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground w-10">
          {String(Math.floor(hour)).padStart(2, '0')}:{String(Math.round((hour % 1) * 60)).padStart(2, '0')}
        </span>
        <Slider
          value={[hour]}
          onValueChange={([v]) => onHourChange(v)}
          min={0}
          max={23.75}
          step={0.25}
          className="flex-1"
        />
        <div className="flex gap-1 text-[10px] text-muted-foreground">
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18</span>
          <span>24</span>
        </div>
      </div>
    </div>
  );
};

export default SimulationBar;
