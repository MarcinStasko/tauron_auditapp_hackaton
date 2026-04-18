import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings2, Clock, CalendarDays, Moon, Plug } from 'lucide-react';
import type { UsageConfig } from '@/lib/types';

interface Props {
  config: UsageConfig;
  onChange: (config: UsageConfig) => void;
  isPerCycle: boolean;
}

const UsageConfigurator = ({ config, onChange, isPerCycle }: Props) => {
  const update = (partial: Partial<UsageConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="h-4 w-4 text-tauron" />
        <h3 className="font-semibold font-display text-foreground">Konfiguracja użytkowania</h3>
      </div>

      {isPerCycle ? (
        <SliderRow
          icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
          label="Użycia tygodniowo"
          value={config.weeklyUses}
          onChange={(v) => update({ weeklyUses: v })}
          min={1}
          max={14}
          step={1}
          unit="×"
        />
      ) : (
        <>
          <SliderRow
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            label="Godzin dziennie"
            value={config.hoursPerDay}
            onChange={(v) => update({ hoursPerDay: v })}
            min={1}
            max={24}
            step={1}
            unit="h"
          />
          <SliderRow
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            label="Dni w tygodniu"
            value={config.daysPerWeek}
            onChange={(v) => update({ daysPerWeek: v })}
            min={1}
            max={7}
            step={1}
            unit="dni"
          />
        </>
      )}

      <SliderRow
        icon={<Moon className="h-4 w-4 text-muted-foreground" />}
        label="Użycie w nocy (po 22:00)"
        value={config.nightUsagePercent}
        onChange={(v) => update({ nightUsagePercent: v })}
        min={0}
        max={100}
        step={5}
        unit="%"
      />

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="standby" className="text-sm text-foreground">Tryb czuwania (standby)</Label>
        </div>
        <Switch
          id="standby"
          checked={config.standbyEnabled}
          onCheckedChange={(v) => update({ standbyEnabled: v })}
        />
      </div>
    </div>
  );
};

function SliderRow({
  icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-foreground">{label}</span>
        </div>
        <span className="text-sm font-bold text-tauron">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default UsageConfigurator;
