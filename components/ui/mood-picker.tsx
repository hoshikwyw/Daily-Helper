"use client";

import { MOODS, MOOD_META } from "@/lib/constants";
import { FormLabel } from "@/components/ui/label";

type MoodPickerProps = {
  /** "" when no mood has been recorded. */
  value: string;
  onChange: (mood: string) => void;
  /** Pass null where a surrounding card header already asks the question. */
  label?: string | null;
};

/**
 * A row of tappable faces, replacing a mood `<select>`.
 *
 * A dropdown costs two taps and reads like a form field to fill in; the faces
 * are one tap and show every option at a glance. Tapping the selected face
 * again clears it, so a mood can be un-set without a "none" entry.
 */
export function MoodPicker({ value, onChange, label = "How was your day?" }: MoodPickerProps) {
  return (
    <div>
      {label && <FormLabel>{label}</FormLabel>}
      <div className="grid grid-cols-5 gap-2">
        {MOODS.map((mood) => {
          const active = value === mood;
          return (
            <button
              key={mood}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : mood)}
              className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-colors ${
                active
                  ? "border-kv-500 bg-kv-500/15"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <span className="text-2xl leading-none">{MOOD_META[mood].emoji}</span>
              <span
                className={`text-xs truncate ${active ? "text-kv-200" : "text-slate-400"}`}
              >
                {MOOD_META[mood].label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-2">
        {value ? "Tap the same face again to clear it." : "Optional — tap a face if you like."}
      </p>
    </div>
  );
}
