"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  toast,
} from "@kwyw/kayv-glass-ui";
import { ModalForm } from "@/components/ui/modal-form";
import { todayISO } from "@/lib/date";
import {
  NO_REPEAT,
  buildSchedule,
  isRepeatComplete,
  type RepeatChoice,
  type Schedule,
} from "@/lib/recurrence";
import { RepeatPicker } from "@/components/ui/repeat-picker";
import { CategoryPicker } from "./category-picker";
import { KindToggle } from "./kind-toggle";
import { isSavingsEntry } from "@/lib/game";
import type { NewExpense } from "@/lib/api/expenses";
import type { EntryKind, Expense, SavingsGoal } from "@/lib/types";

const NO_GOAL = "none";

type AddEntryModalProps = {
  open: boolean;
  onClose: () => void;
  /**
   * `YYYY-MM-DD` the date field starts on each time the modal opens — the day
   * picked in the calendar, so adding to a past day needs no retyping.
   */
  defaultDate?: string;
  /** Categories for each ledger; the picker swaps when the kind changes. */
  categories: Record<EntryKind, { name: string; color: string }[]>;
  /** When set, the form edits this entry instead of creating one. */
  editing?: Expense | null;
  /** Savings goals a Savings expense can count toward. */
  goals?: SavingsGoal[];
  /**
   * True once the goals have loaded on a database that has them. Until then
   * an entry's goal is left exactly as it is, never cleared or invented.
   */
  goalsReady?: boolean;
  /** Seeds a new entry, e.g. "Add money" on a goal: a Savings expense toward it. */
  preset?: { category: string; goal_id: string | null } | null;
  /**
   * Persists a new entry, or sets up a repeating rule when `repeat` is given;
   * returns true on success.
   */
  onSubmit: (values: NewExpense, repeat: Schedule | null) => Promise<boolean>;
  /** Saves changes to `editing`; returns true on success. */
  onUpdate: (id: string, values: NewExpense) => Promise<boolean>;
};

export function AddEntryModal({
  open,
  onClose,
  defaultDate = todayISO(),
  categories,
  editing = null,
  goals = [],
  goalsReady = false,
  preset = null,
  onSubmit,
  onUpdate,
}: AddEntryModalProps) {
  const [kind, setKind] = useState<EntryKind>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories.expense[0]?.name ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [goal, setGoal] = useState<string>(NO_GOAL);
  const [repeat, setRepeat] = useState<RepeatChoice>(NO_REPEAT);
  const [saving, setSaving] = useState(false);

  // The modal stays mounted between uses, so the fields are re-seeded on the
  // open transition rather than once at mount: from the entry being edited,
  // or the calendar's day for a new one. Done during render (React's "adjust
  // state from props" pattern) to avoid a one-frame flash of stale values.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      if (editing) {
        setKind(editing.kind);
        setAmount(String(editing.amount));
        setCategory(editing.category);
        setDescription(editing.description ?? "");
        setDate(editing.date);
        setGoal(editing.goal_id ?? NO_GOAL);
      } else {
        setDate(defaultDate);
        if (preset) {
          setKind("expense");
          setCategory(preset.category);
        }
        setGoal(preset?.goal_id ?? NO_GOAL);
      }
      // A repeat chosen then cancelled must not lie in wait for the next
      // one-off entry and turn it into a rule.
      setRepeat(NO_REPEAT);
    }
  }

  const income = kind === "income";
  // A repeating entry is a rule, and rules carry no goal; each entry the rule
  // makes can be attached from its day.
  const repeating = !editing && repeat.mode !== "never";
  // Only a one-off Savings expense can feed a goal; the picker appears for exactly that.
  const towardGoal = goalsReady && goals.length > 0 && isSavingsEntry({ kind, category }) && !repeating;
  // A goal deleted since the entry was linked is not offered and not resent.
  const goalExists = goals.some((g) => g.id === goal);

  // Switching ledger invalidates the selected category, so reset to that
  // ledger's first one rather than submitting a name it doesn't contain.
  function handleKindChange(next: EntryKind) {
    setKind(next);
    setCategory(categories[next][0]?.name ?? "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) return;
    if (!editing && !isRepeatComplete(repeat)) {
      toast({ title: "Pick at least one day to repeat on", variant: "danger" });
      return;
    }
    const values: NewExpense = {
      kind,
      amount: value,
      category,
      description: description.trim() || null,
      date,
    };
    // Sent only once the goals are known, so an older database never sees
    // the column and a failed load never clears a link. An entry retagged
    // away from Savings, or pointed at a deleted goal, drops its goal.
    if (goalsReady) values.goal_id = towardGoal && goalExists ? goal : null;
    setSaving(true);
    const ok = editing
      ? await onUpdate(editing.id, values)
      : await onSubmit(values, buildSchedule(repeat, date));
    setSaving(false);
    if (ok) {
      // Keep kind, category and date for quick multi-entry; clear the rest.
      // Repeat resets too: setting up two rules by accident is worse than
      // picking the chip again.
      setAmount("");
      setDescription("");
      setRepeat(NO_REPEAT);
      onClose();
    }
  }

  const title = editing ? "Edit entry" : income ? "Add Income" : "Add Expense";
  const action = editing
    ? "Save changes"
    : repeat.mode !== "never"
      ? "Set up repeat"
      : income
        ? "Add Income"
        : "Add Expense";

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>{title}</ModalHeader>
      <ModalForm onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            {/* Ledger switch — money out or money in */}
            <KindToggle value={kind} onChange={handleKindChange} />

            <Input
              label="Amount (K)"
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <CategoryPicker
              categories={categories[kind]}
              value={category}
              onChange={setCategory}
            />
            {towardGoal && (
              <Select
                label="Toward a goal"
                value={goal}
                onChange={setGoal}
                options={[
                  { value: NO_GOAL, label: "No goal" },
                  ...goals.map((g) => ({ value: g.id, label: `${g.emoji} ${g.name}` })),
                ]}
              />
            )}
            {repeating && goal !== NO_GOAL && goalsReady && (
              <p className="text-xs text-slate-400">
                A repeating entry is saved without a goal. Each one it creates can be attached from its day.
              </p>
            )}
            <Input
              label="Description"
              placeholder={income ? "Salary, refund, gift…" : "Coffee, groceries, taxi…"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            {/* An existing entry is one row; repeating is set up at creation. */}
            {!editing && <RepeatPicker value={repeat} onChange={setRepeat} date={date} />}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : action}
          </Button>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
