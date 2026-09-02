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
import { NativeSelect } from "@/components/ui/native-select";
import { todayISO } from "@/lib/date";
import { ENTRY_KINDS } from "@/lib/expenses";
import type { NewExpense } from "@/lib/api/expenses";
import type { EntryKind } from "@/lib/types";

type AddEntryModalProps = {
  open: boolean;
  onClose: () => void;
  /** Categories for each ledger; the picker swaps when the kind changes. */
  categories: Record<EntryKind, { name: string; color: string }[]>;
  /** Persists the entry; returns true on success. */
  onSubmit: (values: NewExpense) => Promise<boolean>;
};

export function AddEntryModal({ open, onClose, categories, onSubmit }: AddEntryModalProps) {
  const [kind, setKind] = useState<EntryKind>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories.expense[0]?.name ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

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
            <div className="grid grid-cols-2 gap-2">
              {ENTRY_KINDS.map(({ value, label }) => {
                const active = kind === value;
                const activeClass =
                  value === "income"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500 bg-rose-500/10 text-rose-300";
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleKindChange(value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      active
                        ? activeClass
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {value === "income" ? "↓ " : "↑ "}
                    {label}
                  </button>
                );
              })}
            </div>

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
            <NativeSelect
              label="Category"
              value={category}
              onChange={setCategory}
              options={categories[kind].map((c) => ({ value: c.name, label: c.name }))}
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
