"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@kwyw/kayv-glass-ui";
import { todayISO } from "@/lib/date";
import { CategoryPicker } from "./category-picker";
import { KindToggle } from "./kind-toggle";
import type { NewExpense } from "@/lib/api/expenses";
import type { EntryKind } from "@/lib/types";

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
  /** Persists the entry; returns true on success. */
  onSubmit: (values: NewExpense) => Promise<boolean>;
};

export function AddEntryModal({
  open,
  onClose,
  defaultDate = todayISO(),
  categories,
  onSubmit,
}: AddEntryModalProps) {
  const [kind, setKind] = useState<EntryKind>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories.expense[0]?.name ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [saving, setSaving] = useState(false);

  // The modal stays mounted between uses, so the date is re-seeded on the
  // open transition rather than once at mount. Done during render (React's
  // "adjust state from props" pattern) to avoid a one-frame flash of the old
  // date that an effect would cause.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDate(defaultDate);
  }

  const income = kind === "income";

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
    setSaving(true);
    const ok = await onSubmit({
      kind,
      amount: value,
      category,
      description: description.trim() || null,
      date,
    });
    setSaving(false);
    if (ok) {
      // Keep kind, category and date for quick multi-entry; clear the rest.
      setAmount("");
      setDescription("");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>{income ? "Add Income" : "Add Expense"}</ModalHeader>
      <form onSubmit={handleSubmit}>
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
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Adding…" : income ? "Add Income" : "Add Expense"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
