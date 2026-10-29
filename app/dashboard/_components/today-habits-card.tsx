"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, Button, Input } from "@kwyw/kayv-glass-ui";
import { MAX_ACTIVE_HABITS, doneTodayCount, type HabitStatus } from "@/lib/habits";
import { plural } from "@/lib/text";

type TodayHabitsCardProps = {
  statuses: HabitStatus[];
  loaded: boolean;
  /** Flips today's state for the habit; saves immediately. */
  onToggle: (habitId: string) => void;
  /** Adds a habit by name; returns false when the write failed. */
  onAdd: (name: string) => Promise<boolean>;
};

/**
 * Tappable chips, one per habit, with the running streak. Tapping toggles
 * today and saves at once, like the mood picker beside it. A quick add field
 * sits underneath so the first habit takes seconds to set up.
 */
export function TodayHabitsCard({ statuses, loaded, onToggle, onAdd }: TodayHabitsCardProps) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const done = doneTodayCount(statuses);
  const atLimit = statuses.length >= MAX_ACTIVE_HABITS;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || atLimit) return;
    setAdding(true);
    const ok = await onAdd(trimmed);
    setAdding(false);
    if (ok) setName("");
  }

  return (
    <Card variant="elevated">
      <CardHeader
        title="Habits"
        description={
          statuses.length === 0
            ? "Small things, every day. Add one to start a streak."
            : `${done} of ${plural(statuses.length, "habit")} done today`
        }
      />
      <CardContent>
        <div className="space-y-4">
          {statuses.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {statuses.map(({ habit, doneToday, streak }) => (
                <button
                  key={habit.id}
                  type="button"
                  aria-pressed={doneToday}
                  onClick={() => onToggle(habit.id)}
                  className={`flex flex-col items-center gap-1 min-h-20 py-2.5 px-1 rounded-xl border transition-colors ${
                    doneToday
                      ? "border-kv-500 bg-kv-500/15"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span className="text-2xl leading-none">{habit.emoji}</span>
                  <span
                    className={`text-xs truncate max-w-full ${doneToday ? "text-kv-200" : "text-slate-400"}`}
                  >
                    {habit.name}
                  </span>
                  {/* Fixed-height slot so the row never shifts as streaks start and stop. */}
                  <span
                    className={`text-[11px] leading-none h-3 tabular-nums ${
                      streak.current > 0 ? "text-amber-300" : "text-transparent"
                    }`}
                    aria-label={streak.current > 0 ? `${streak.current}-day streak` : undefined}
                  >
                    {streak.current > 0 ? `🔥 ${streak.current}` : "·"}
                  </span>
                </button>
              ))}
            </div>
          )}

          {loaded && !atLimit && (
            <form onSubmit={handleAdd} className="flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <Input
                  placeholder={statuses.length === 0 ? "e.g. Drink water" : "Add another habit"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-label="New habit"
                />
              </div>
              <Button variant="ghost" size="sm" type="submit" disabled={adding || !name.trim()}>
                {adding ? "Adding…" : "+ Add"}
              </Button>
            </form>
          )}
          {atLimit && (
            <p className="text-xs text-slate-500">
              {MAX_ACTIVE_HABITS} habits is the limit, so the row stays tappable on a phone.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
