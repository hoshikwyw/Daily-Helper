"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, toast } from "@kwyw/kayv-glass-ui";
import { FieldLabel } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DEFAULT_HABIT_EMOJI,
  MAX_ACTIVE_HABITS,
  activeHabits,
  canActivate,
  reorderedIds,
} from "@/lib/habits";
import { graphemeCount } from "@/lib/text";
import type { HabitPatch } from "@/lib/api/habits";
import type { Habit } from "@/lib/types";

type ManageHabitsModalProps = {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
  /** Writes one habit's changes; returns false on failure. */
  onPatch: (id: string, patch: HabitPatch) => Promise<boolean>;
  /** Writes positions so the active habits take this order of ids. */
  onReorder: (ids: string[]) => Promise<boolean>;
};

const FIELD =
  "h-10 rounded-lg bg-white/10 border border-white/10 text-slate-200 text-sm px-3 focus:outline-none focus:border-white/30 transition-colors";

const ARROW = "h-10 w-8 rounded-lg text-slate-400 hover:bg-white/10 disabled:opacity-30";

/**
 * Edit, reorder, archive, and restore habits. Name and emoji edits are saved
 * together with the Save button; reorder, archive, and restore write at once,
 * since each is a single tap with an obvious result.
 */
export function ManageHabitsModal({
  open,
  onClose,
  habits,
  onPatch,
  onReorder,
}: ManageHabitsModalProps) {
  // Drafts hold edited name/emoji by habit id; untouched rows read from `habits`.
  const [drafts, setDrafts] = useState<Record<string, { name: string; emoji: string }>>({});
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDrafts({});
  }

  const active = activeHabits(habits);
  const archived = habits.filter((h) => h.archived);
  const roomForMore = canActivate(habits);

  function draftFor(habit: Habit) {
    return drafts[habit.id] ?? { name: habit.name, emoji: habit.emoji };
  }

  function edit(habit: Habit, patch: Partial<{ name: string; emoji: string }>) {
    setDrafts((prev) => ({ ...prev, [habit.id]: { ...draftFor(habit), ...patch } }));
  }

  async function move(index: number, delta: -1 | 1) {
    // Arrows are disabled while a move is in flight, so two quick taps cannot
    // both read the same order and undo each other.
    setMoving(true);
    await onReorder(reorderedIds(habits, index, delta));
    setMoving(false);
  }

  async function setArchived(habit: Habit, archived: boolean) {
    if (!archived && !roomForMore) {
      toast({
        title: `${MAX_ACTIVE_HABITS} active habits is the limit`,
        description: "Archive one first to restore this.",
        variant: "warning",
      });
      return;
    }
    if (await onPatch(habit.id, { archived })) {
      toast({
        title: archived ? "Habit archived" : "Habit restored",
        description: archived ? "Its history is kept." : undefined,
        variant: archived ? "warning" : "success",
      });
    }
  }

  async function handleSave() {
    const changes = Object.entries(drafts)
      .map(([id, draft]) => ({
        id,
        name: draft.name.trim(),
        emoji: draft.emoji.trim() || DEFAULT_HABIT_EMOJI,
        original: habits.find((h) => h.id === id),
      }))
      .filter((c) => c.original && (c.name !== c.original.name || c.emoji !== c.original.emoji));

    if (changes.some((c) => !c.name)) {
      toast({ title: "A habit needs a name", variant: "danger" });
      return;
    }
    const longEmoji = changes.find((c) => graphemeCount(c.emoji) > 1);
    if (longEmoji) {
      toast({
        title: `Use a single emoji for ${longEmoji.name}`,
        description: "One symbol keeps the chip readable.",
        variant: "danger",
      });
      return;
    }
    if (changes.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    const results = await Promise.all(
      changes.map((c) => onPatch(c.id, { name: c.name, emoji: c.emoji }))
    );
    setSaving(false);
    if (results.every(Boolean)) {
      toast({ title: "Habits saved", variant: "success" });
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>Manage habits</ModalHeader>
      <ModalBody>
        <div className="space-y-5">
          <div>
            <FieldLabel>Active</FieldLabel>
            {active.length === 0 ? (
              <EmptyState padding="sm">No active habits.</EmptyState>
            ) : (
              <div className="space-y-2">
                {active.map((habit, index) => {
                  const draft = draftFor(habit);
                  return (
                    <div key={habit.id} className="flex items-center gap-2">
                      <input
                        aria-label={`Emoji for ${habit.name}`}
                        value={draft.emoji}
                        onChange={(e) => edit(habit, { emoji: e.target.value })}
                        className={`${FIELD} w-12 text-center text-lg px-0`}
                      />
                      <input
                        aria-label={`Name for ${habit.name}`}
                        value={draft.name}
                        onChange={(e) => edit(habit, { name: e.target.value })}
                        className={`${FIELD} flex-1 min-w-0`}
                      />
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={moving || index === 0}
                        aria-label="Move up"
                        className={ARROW}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={moving || index === active.length - 1}
                        aria-label="Move down"
                        className={ARROW}
                      >
                        ↓
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => setArchived(habit, true)}>
                        Archive
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {archived.length > 0 && (
            <div>
              <FieldLabel>Archived</FieldLabel>
              <div className="space-y-1.5">
                {archived.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-lg bg-white/5 opacity-70"
                  >
                    <span className="text-lg leading-none">{habit.emoji}</span>
                    <span className="text-sm text-slate-300 flex-1 truncate">{habit.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setArchived(habit, false)}
                      disabled={!roomForMore}
                    >
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
              {!roomForMore && (
                <p className="text-xs text-slate-500 mt-2">
                  Archive an active habit to make room before restoring one.
                </p>
              )}
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} type="button">
          Close
        </Button>
        <Button variant="primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
