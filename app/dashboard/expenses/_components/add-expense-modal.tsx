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

export type NewExpense = {
  amount: number;
  category: string;
  description: string | null;
  date: string;
};

type AddExpenseModalProps = {
  open: boolean;
  onClose: () => void;
  categories: { name: string; color: string }[];
  /** Persists the expense; returns true on success. */
  onSubmit: (values: NewExpense) => Promise<boolean>;
};

export function AddExpenseModal({ open, onClose, categories, onSubmit }: AddExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(categories[0]?.name ?? "");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!amount || isNaN(value) || value <= 0) return;
    setSaving(true);
    const ok = await onSubmit({
      amount: value,
      category,
      description: description.trim() || null,
      date,
    });
    setSaving(false);
    if (ok) {
      // Keep category and date for quick multi-entry; clear the rest.
      setAmount("");
      setDescription("");
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>Add Expense</ModalHeader>
      <form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
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
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
            />
            <Input
              label="Description"
              placeholder="Coffee, groceries, taxi…"
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
            {saving ? "Adding…" : "Add Expense"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
