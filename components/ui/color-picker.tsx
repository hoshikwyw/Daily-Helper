"use client";

// A row of selectable color swatches. Used by the project and expense-category
// forms, which each previously inlined the same button grid.

type ColorPickerProps = {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
  label?: string;
  size?: "sm" | "md";
};

const SIZES = {
  sm: "w-6 h-6",
  md: "w-7 h-7",
} as const;

export function ColorPicker({
  colors,
  value,
  onChange,
  label,
  size = "md",
}: ColorPickerProps) {
  return (
    <div>
      {label && (
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      )}
      <div className="flex gap-2 flex-wrap">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            aria-label={`Set color ${c}`}
            className={`${SIZES[size]} rounded-full transition-transform ${
              value === c ? "scale-125 ring-2 ring-white/60" : "hover:scale-110"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
}
