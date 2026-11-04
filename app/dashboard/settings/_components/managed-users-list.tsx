"use client";

import { useState } from "react";
import { Badge, Card, CardContent, CardHeader, toast } from "@kwyw/kayv-glass-ui";
import { resendConfirmation, revokeInvitation } from "@/lib/api/admin";
import {
  MANAGED_USER_STATUS_LABELS,
  managedUserStatus,
  type ManagedUserStatus,
} from "@/lib/admin";
import { formatLongDate } from "@/lib/date";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { ManagedUserRow } from "@/lib/types";

const STATUS_VARIANT: Record<ManagedUserStatus, "success" | "warning" | "default"> = {
  active: "success",
  awaiting_confirmation: "warning",
  invited: "default",
};

type ManagedUsersListProps = {
  /** null while the first read is still in flight. */
  users: ManagedUserRow[] | null;
  /** Re-reads the list, for changes whose outcome only the server knows. */
  onRefresh: () => Promise<void>;
  /** Drops one row locally; the delete already told us exactly what went. */
  onRemoved: (email: string) => void;
};

/** Everyone the admin has invited, with where each account stands. */
export function ManagedUsersList({ users, onRefresh, onRemoved }: ManagedUsersListProps) {
  const [resending, setResending] = useState<string | null>(null);

  async function handleResend(row: ManagedUserRow) {
    setResending(row.email);
    try {
      const message = await resendConfirmation(row.email);
      if (message) {
        toast({ title: "Couldn't resend", description: message, variant: "danger" });
        return;
      }
      toast({ title: "Confirmation email sent", description: `To ${row.email}.`, variant: "success" });
      // They may have confirmed since the list was loaded; Supabase answers a
      // resend for a confirmed account with success and no email.
      await onRefresh();
    } finally {
      setResending(null);
    }
  }

  async function handleRevoke(row: ManagedUserRow) {
    if (!(await revokeInvitation(row.email))) return;
    toast({ title: "Invitation removed", variant: "warning" });
    onRemoved(row.email);
  }

  return (
    <Card variant="elevated">
      <CardHeader
        title="Accounts"
        description="Everyone you have invited, and whether their account is in use."
      />
      <CardContent>
        {users === null ? (
          <SkeletonList count={3} />
        ) : users.length === 0 ? (
          <EmptyState padding="lg">No accounts created yet.</EmptyState>
        ) : (
          <div className="space-y-2">
            {users.map((row) => {
              const status = managedUserStatus(row);
              return (
                <div
                  key={row.email}
                  className="flex items-center gap-3 pl-3 pr-1 py-2 rounded-lg bg-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{row.email}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {row.note ? `${row.note} · ` : ""}
                      {row.last_sign_in_at
                        ? `Last sign-in ${formatLongDate(new Date(row.last_sign_in_at))}`
                        : `Invited ${formatLongDate(new Date(row.invited_at))}`}
                    </p>
                    {status === "awaiting_confirmation" && (
                      <button
                        type="button"
                        onClick={() => handleResend(row)}
                        disabled={resending === row.email}
                        className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                      >
                        {resending === row.email ? "Sending…" : "Resend confirmation email"}
                      </button>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANT[status]} size="sm">
                    {MANAGED_USER_STATUS_LABELS[status]}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => handleRevoke(row)}
                    aria-label={`Remove invitation for ${row.email}`}
                    title="Remove the invitation. An existing account keeps working."
                    className="text-slate-400 hover:text-red-400 text-xl leading-none shrink-0 h-11 w-11 flex items-center justify-center rounded-lg"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-4">
          Removing an invitation stops that email from signing up again. It does not disable an
          account that already exists; that can only be done from the Supabase dashboard.
        </p>
      </CardContent>
    </Card>
  );
}
