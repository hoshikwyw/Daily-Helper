"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  toast,
} from "@kwyw/kayv-glass-ui";
import {
  createManagedUser,
  listManagedUsers,
  revokeInvitation,
} from "@/lib/api/admin";
import {
  MANAGED_USER_STATUS_LABELS,
  generatePassword,
  isValidEmail,
  managedUserStatus,
  passwordProblem,
  type ManagedUserStatus,
} from "@/lib/admin";
import { formatLongDate } from "@/lib/date";
import { PasswordInput } from "@/components/ui/password-input";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { ManagedUserRow } from "@/lib/types";

const STATUS_VARIANT: Record<ManagedUserStatus, "success" | "warning" | "default"> = {
  active: "success",
  awaiting_confirmation: "warning",
  invited: "default",
};

/** The credentials just created, shown once so the admin can pass them on. */
type Handout = { email: string; password: string; status: "active" | "awaiting_confirmation" };

/**
 * Admin only: create accounts for other people and see where each stands.
 * The password is shown exactly once after creation; it is not stored
 * anywhere the admin can read it again, so copying it is part of the flow.
 */
export function UsersTab() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [handout, setHandout] = useState<Handout | null>(null);

  const [users, setUsers] = useState<ManagedUserRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setUsers(await listManagedUsers());
    setLoading(false);
  }

  useEffect(() => {
    // State is set only after the query resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, []);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${what} copied`, variant: "success" });
    } catch {
      toast({ title: `Couldn't copy the ${what.toLowerCase()}`, variant: "warning" });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    setCreating(true);
    const result = await createManagedUser(email, password, note);
    setCreating(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHandout({ email: email.trim().toLowerCase(), password, status: result.status });
    setEmail("");
    setPassword("");
    setNote("");
    refresh();
  }

  async function handleRevoke(row: ManagedUserRow) {
    if (!(await revokeInvitation(row.email))) return;
    setUsers((prev) => prev.filter((u) => u.email !== row.email));
    toast({ title: "Invitation removed", variant: "warning" });
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated">
        <CardHeader
          title="Create an account"
          description="The person signs in with this email and password. Share them privately."
        />
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="off"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="space-y-2">
              <PasswordInput
                label="Password"
                autoComplete="new-password"
                placeholder="At least 8 characters, letters and numbers"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPassword(generatePassword())}
                >
                  Generate a password
                </Button>
                {password && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copy(password, "Password")}
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>
            <Input
              label="Note (optional)"
              placeholder="Who this is for, e.g. Mum's phone"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            {error && <Alert variant="danger">{error}</Alert>}

            <Button variant="primary" type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create account"}
            </Button>
          </form>

          {handout && (
            <div className="mt-4">
              <Alert
                variant={handout.status === "active" ? "success" : "warning"}
                title={
                  handout.status === "active"
                    ? "Account created and ready to use"
                    : "Account created — confirmation email sent"
                }
              >
                <div className="space-y-2 text-sm">
                  <p>
                    {handout.status === "active"
                      ? "Pass these on; the password is not shown again."
                      : "They must click the link in the email before signing in. Pass these on; the password is not shown again."}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="px-2 py-1 rounded bg-black/30 text-slate-100">{handout.email}</code>
                    <code className="px-2 py-1 rounded bg-black/30 text-slate-100 tabular-nums">
                      {handout.password}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copy(`Email: ${handout.email}\nPassword: ${handout.password}`, "Details")
                      }
                    >
                      Copy both
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setHandout(null)}>
                      Done
                    </Button>
                  </div>
                </div>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader
          title="Accounts"
          description="Everyone you have invited, and whether their account is in use."
        />
        <CardContent>
          {loading ? (
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
    </div>
  );
}
