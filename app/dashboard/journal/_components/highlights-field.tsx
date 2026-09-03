"use client";

import { useState } from "react";
import { Button, Input } from "@kwyw/kayv-glass-ui";
import { addHighlight, removeHighlight } from "@/lib/journal";
import { FormLabel } from "@/components/ui/label";

type HighlightsFieldProps = {
  highlights: string[];
  onChange: (highlights: string[]) => void;
};

/**
 * Short list of good things from the day. Labelled in plain words rather than
 * "Highlights", which doesn't tell a first-time user what belongs here.
 */
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
      <FormLabel mb="1.5">Good things that happened</FormLabel>
      <p className="text-xs text-slate-500 mb-2">
        One short line each — a small win, something nice, anything you want to remember.
      </p>
      <div className="flex gap-2 mb-3">
        <Input
          placeholder="e.g. finished the login page"
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
      {highlights.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(removeHighlight(highlights, i))}
                title="Tap to remove"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-kv-500/20 text-kv-300 text-xs hover:bg-red-500/20 hover:text-red-300 transition-colors"
              >
                ✦ {highlight} <span className="ml-1 opacity-60">×</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">Tap one to remove it.</p>
        </>
      ) : (
        <p className="text-xs text-slate-600">
          Nothing added yet — press Enter after typing to add one.
        </p>
      )}
    </div>
  );
}
