"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, toast } from "@kwyw/kayv-glass-ui";
import { ModalForm } from "@/components/ui/modal-form";
import { FormLabel } from "@/components/ui/label";
import { DEFAULT_GOAL_EMOJI, GOAL_NAME_MAX } from "@/lib/savings-goals";
import type { NewGoal } from "@/lib/api/savings-goals";
import type { SavingsGoal } from "@/lib/types";

type GoalModalProps = {
  open: boolean;
  onClose: () => void;
  /** When set, the form edits this goal instead of creating one. */
  editing?: SavingsGoal | null;
  onSubmit: (values: NewGoal) => Promise<boolean>;
  onUpdate: (id: string, values: NewGoal) => Promise<boolean>;
};

const EMOJI_CHOICES = ["🎯", "💻", "✈️", "🏠", "🚗", "🎓", "💍", "🛡️", "🎁", "🌴"];

/** Name a goal, give it an amount, and optionally a date to reach it by. */
export function GoalModal({ open, onClose, editing = null, onSubmit, onUpdate }: GoalModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_GOAL_EMOJI);
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  // Re-seeded on each open: from the goal being edited, or blank.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(editing?.name ?? "");
      setEmoji(editing?.emoji ?? DEFAULT_GOAL_EMOJI);
      setTarget(editing ? String(editing.target) : "");
      setDeadline(editing?.deadline ?? "");
    }
  }

  const trimmed = name.trim();
  const nameLength = Array.from(trimmed).length;
  const nameOk = nameLength > 0 && nameLength <= GOAL_NAME_MAX;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(target);
    if (!nameOk) return;
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a target above zero", variant: "danger" });
      return;
    }
    const values: NewGoal = {
      name: trimmed,
      emoji: emoji || DEFAULT_GOAL_EMOJI,
      target: Math.round(amount),
      deadline: deadline || null,
    };
    setSaving(true);
    const ok = editing ? await onUpdate(editing.id, values) : await onSubmit(values);
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>{editing ? "Edit goal" : "New savings goal"}</ModalHeader>
      <ModalForm onSubmit={handleSubmit}>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <FormLabel>Icon</FormLabel>
              <div role="group" aria-label="Icon" className="flex flex-wrap gap-2">
                {EMOJI_CHOICES.map((choice) => {
                  const selected = choice === emoji;
                  return (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={selected}
                      aria-label={choice}
                      onClick={() => setEmoji(choice)}
                      className={`h-11 w-11 rounded-xl border text-xl transition-colors ${
                        selected ? "border-kv-500 bg-kv-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
            <Input
              label="What for"
              placeholder="Laptop, trip, emergency fund…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              error={
                nameLength > GOAL_NAME_MAX
                  ? `That is ${nameLength - GOAL_NAME_MAX} over the ${GOAL_NAME_MAX}-character limit.`
                  : undefined
              }
            />
            <Input
              label="Target (K)"
              type="number"
              step="1"
              min="1"
              placeholder="0"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              required
            />
            <Input
              label="By when (optional)"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              hint="With a date, the goal says how much each month needs."
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={saving || !nameOk}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create goal"}
          </Button>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
