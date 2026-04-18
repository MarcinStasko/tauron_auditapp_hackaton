import { Slider } from '@/components/ui/slider';

interface Props {
  value: number;
  onChange: (val: number) => void;
}

const InteractiveSlider = ({ value, onChange }: Props) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-foreground">Użycia tygodniowo</label>
      <span className="text-lg font-bold text-tauron">{value}×</span>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={1}
      max={14}
      step={1}
      className="w-full"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>1×</span>
      <span>14×</span>
    </div>
  </div>
);

export default InteractiveSlider;
