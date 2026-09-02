"use client";

import { useState } from "react";
import { Button, Input } from "@kwyw/kayv-glass-ui";
import { addHighlight, removeHighlight } from "@/lib/journal";
import { FormLabel } from "@/components/ui/label";

type HighlightsFieldProps = {
  highlights: string[];
  onChange: (highlights: string[]) => void;
};

/** Tag-style list of the day's wins. Owns its own draft input. */
export function HighlightsField({ highlights, onChange }: HighlightsFieldProps) {
  const [draft, setDraft] = useState("");

  function commit() {
    const next = addHighlight(highlights, draft);
    if (next === highlights) return;
    onChange(next);
    setDraft("");
  }

  return (
    <div>
      <FormLabel>Highlights</FormLabel>
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="Add a highlight..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          className="flex-1"
        />
        <Button variant="ghost" size="sm" onClick={commit} type="button">
          Add
        </Button>
      </div>
      {highlights.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {highlights.map((highlight, i) => (
            <button
              key={i}
              onClick={() => onChange(removeHighlight(highlights, i))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-kv-500/20 text-kv-300 text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
            >
              ✦ {highlight} <span className="ml-1 opacity-60">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
