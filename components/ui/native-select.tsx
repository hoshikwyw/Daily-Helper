"use client";

// A styled native <select>. The glass UI library's <Select> renders a custom
// popover, but several places need the OS-native picker (better on mobile) with
// the app's glass styling. This wraps the raw element + dark <option> styling
// that was duplicated in the tasks and expenses pages.

type Option = { value: string; label: string };

type NativeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label?: string;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
};

const SIZES = {
  sm: "px-2 py-1.5 text-xs",
  md: "w-full px-3 py-2.5 text-sm",
} as const;

export function NativeSelect({
  value,
  onChange,
  options,
  label,
  size = "md",
  className = "",
  "aria-label": ariaLabel,
}: NativeSelectProps) {
  const select = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={`rounded-lg bg-white/10 border border-white/10 text-slate-200 cursor-pointer focus:outline-none focus:border-white/30 transition-colors ${SIZES[size]} ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0f172a] text-slate-200">
          {o.label}
        </option>
      ))}
    </select>
  );

  if (!label) return select;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      {select}
    </div>
  );
}
