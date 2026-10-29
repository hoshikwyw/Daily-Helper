"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, toast } from "@kwyw/kayv-glass-ui";
import { FormLabel } from "@/components/ui/label";

type SetBudgetsModalProps = {
  open: boolean;
  onClose: () => void;
  /** "November 2026" — the month the limits apply from. */
  monthLabel: string;
  /** The expense categories to offer, in display order. */
  categories: { name: string; color: string }[];
  /** The limits in force for the month, keyed by category. */
  limits: Record<string, number>;
  /** Writes one limit; 0 clears it. Returns false on failure. */
  onSave: (category: string, amount: number) => Promise<boolean>;
};

/**
 * One amount field per expense category. Only fields the user changed are
 * written, so saving with nothing touched is a no-op. Blank means no limit.
 */
export function SetBudgetsModal({
  open,
  onClose,
  monthLabel,
  categories,
  limits,
  onSave,
}: SetBudgetsModalProps) {
  // Drafts hold the text as typed; `limits` is the source until a field is edited.
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // The modal stays mounted between uses; drop stale drafts on each open.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDrafts({});
  }

  function valueFor(name: string): string {
    if (name in drafts) return drafts[name];
    const limit = limits[name];
    return limit ? String(limit) : "";
  }

  // Budgeted categories that no longer exist (deleted after the limit was set)
  // are listed too, so the limit can still be blanked out.
  const orphans = Object.keys(limits)
    .filter((name) => !categories.some((c) => c.name === name))
    .map((name) => ({ name, color: "#64748b", removed: true }));
  const rows = [...categories.map((c) => ({ ...c, removed: false })), ...orphans];

  async function handleSave() {
    const parsed = Object.entries(drafts).map(([category, text]) => ({
      category,
      amount: text.trim() === "" ? 0 : Number(text),
    }));
    const invalid = parsed.find(({ amount }) => !Number.isInteger(amount) || amount < 0);
    if (invalid) {
      toast({
        title: `Check the ${invalid.category} limit`,
        description: "Enter a whole number of K, or leave it blank for no limit.",
        variant: "danger",
      });
      return;
    }
    const changes = parsed.filter(({ category, amount }) => amount !== (limits[category] ?? 0));

    if (changes.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    const results = await Promise.all(changes.map((c) => onSave(c.category, c.amount)));
    setSaving(false);
    if (results.every(Boolean)) {
      toast({ title: "Budgets saved", variant: "success" });
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>Budgets for {monthLabel}</ModalHeader>
      <ModalBody>
        <p className="text-xs text-slate-400 mb-4">
          Limits apply from {monthLabel} onward until you change them. Leave a field blank for
          no limit.
        </p>
        <div className="space-y-3">
          {rows.map((category) => (
            <div key={category.name} className="flex items-center gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: category.color }}
              />
              <FormLabel htmlFor={`budget-${category.name}`} mb="1.5">
                <span className="inline-block w-32 truncate align-middle">
                  {category.name}
                  {category.removed && (
                    <span className="text-xs text-slate-500"> (removed)</span>
                  )}
                </span>
              </FormLabel>
              <div className="relative flex-1 min-w-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  K
                </span>
                <input
                  id={`budget-${category.name}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="1"
                  placeholder="No limit"
                  value={valueFor(category.name)}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [category.name]: e.target.value }))
                  }
                  className="w-full h-11 pl-7 pr-3 rounded-lg bg-white/10 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-white/30 transition-colors tabular-nums"
                />
              </div>
            </div>
          ))}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button variant="primary" type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save budgets"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
