"use client";

// The app's multi-line text input. The glass UI library ships no textarea, so
// the journal and project-notes screens each styled a raw element; this is the
// single styled version they now share.

import { FormLabel } from "@/components/ui/label";

const RESIZE = {
  none: "resize-none",
  y: "resize-y",
} as const;

type TextAreaProps = {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  label?: string;
  /** "y" lets the user drag the box taller; "none" pins it to `rows`. */
  resize?: keyof typeof RESIZE;
};

export function TextArea({
  value,
  onChange,
  rows = 8,
  placeholder,
  label,
  resize = "none",
}: TextAreaProps) {
  const field = (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`w-full rounded-lg bg-white/5 border border-white/10 px-3.5 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-kv-500 transition-colors ${RESIZE[resize]}`}
    />
  );

  if (!label) return field;

  return (
    <div>
      <FormLabel>{label}</FormLabel>
      {field}
    </div>
  );
}
