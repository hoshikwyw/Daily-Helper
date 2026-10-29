"use client";

import { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, toast } from "@kwyw/kayv-glass-ui";
import {
  deleteRecurrence,
  listRecurrences,
  pauseRecurrence,
  resumeRecurrence,
} from "@/lib/api/recurrences";
import { describeSchedule, occurrenceOnOrAfter } from "@/lib/recurrence";
import { formatLongDate, todayISO } from "@/lib/date";
import { useRecurrenceSync } from "@/components/recurrence-sync";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { Recurrence, RecurrenceTarget } from "@/lib/types";

type RecurringRulesModalProps = {
  open: boolean;
  onClose: () => void;
  target: RecurrenceTarget;
  title: string;
  /** The first line of a rule's row: what it creates. */
  renderSummary: (rule: Recurrence) => React.ReactNode;
  /** Shown when there are no rules yet. */
  emptyHint: string;
};

/** A rule with nothing left to create: its end date leaves no occurrence from today on. */
function hasEnded(rule: Recurrence, today: string): boolean {
  return rule.end_date !== null && occurrenceOnOrAfter(rule, today) === null;
}

/** "Next December 1, 2026", "Paused", or "Ended". */
function statusLabel(rule: Recurrence, today: string): string {
  if (rule.active) return `Next ${formatLongDate(rule.next_due)}`;
  return hasEnded(rule, today) ? "Ended" : "Paused";
}

/**
 * Lists one target's recurring rules with pause, resume, and delete. Shared by
 * the Money and Tasks pages; the caller says what a rule looks like.
 *
 * Deleting a rule keeps everything it already created — the rows just lose
 * their link — so it is not a destructive action on the ledger itself.
 */
export function RecurringRulesModal({
  open,
  onClose,
  target,
  title,
  renderSummary,
  emptyHint,
}: RecurringRulesModalProps) {
  const [rules, setRules] = useState<Recurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const { sync } = useRecurrenceSync();

  useEffect(() => {
    if (!open) return;
    // Loaded fresh each time the modal opens: rules are edited rarely and
    // the list is small, so staleness would cost more than the fetch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    listRecurrences(target).then((rows) => {
      setRules(rows);
      setLoading(false);
    });
  }, [open, target]);

  async function handleToggle(rule: Recurrence) {
    if (rule.active) {
      if (!(await pauseRecurrence(rule.id))) return;
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, active: false } : r)));
      toast({ title: "Paused", variant: "warning" });
      return;
    }

    const today = todayISO();
    if (hasEnded(rule, today)) {
      toast({ title: "This repeat has ended", description: "Its end date has passed.", variant: "warning" });
      return;
    }
    // Resuming skips what was missed while paused and continues from today.
    const resumed = await resumeRecurrence(rule, today);
    if (!resumed) return;
    setRules((prev) => prev.map((r) => (r.id === rule.id ? resumed : r)));
    toast({ title: "Resumed", description: "Continues from today.", variant: "success" });
    // The resumed rule may be due today.
    sync();
  }

  async function handleDelete(rule: Recurrence) {
    if (!(await deleteRecurrence(rule.id))) return;
    setRules((prev) => prev.filter((r) => r.id !== rule.id));
    toast({
      title: "Repeat removed",
      description: "Anything it already created is kept.",
      variant: "warning",
    });
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader>{title}</ModalHeader>
      <ModalBody>
        {loading ? (
          <SkeletonList count={3} />
        ) : rules.length === 0 ? (
          <EmptyState padding="lg">{emptyHint}</EmptyState>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`flex items-center gap-3 pl-3 pr-1 py-2 rounded-lg bg-white/5 ${
                  rule.active ? "" : "opacity-60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{renderSummary(rule)}</div>
                  <p className="text-xs text-slate-400 truncate">
                    {describeSchedule(rule)} · {statusLabel(rule, todayISO())}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleToggle(rule)}>
                  {rule.active ? "Pause" : "Resume"}
                </Button>
                <button
                  type="button"
                  onClick={() => handleDelete(rule)}
                  aria-label="Delete repeat"
                  className="text-slate-400 hover:text-red-400 text-xl leading-none shrink-0 h-11 w-11 flex items-center justify-center rounded-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose} type="button">
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}
