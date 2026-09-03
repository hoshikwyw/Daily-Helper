import { Checkbox } from "@kwyw/kayv-glass-ui";

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** A labelled switch row — the repeated pattern across the settings tabs. */
export function ToggleRow({ title, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
      <div>
        <p className="text-sm font-medium text-slate-200">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
