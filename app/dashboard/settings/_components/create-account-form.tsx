"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, CardHeader, Input, toast } from "@kwyw/kayv-glass-ui";
import { createManagedUser } from "@/lib/api/admin";
import { handoutText, isValidEmail } from "@/lib/admin";
import { generatePassword, passwordProblem } from "@/lib/password";
import { canShareText, shareText } from "@/lib/share";
import { PasswordInput } from "@/components/ui/password-input";

/** The credentials just created, shown once so the admin can pass them on. */
type Handout = { email: string; password: string; status: "active" | "awaiting_confirmation" };

type CreateAccountFormProps = {
  /** Called after an account is created, so the list alongside can refresh. */
  onCreated: () => void;
};

/**
 * The admin's create-account form and the one-time handout that follows it.
 * The password is shown exactly once after creation; it is not stored
 * anywhere the admin can read it again, so copying it is part of the flow.
 */
export function CreateAccountForm({ onCreated }: CreateAccountFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [handout, setHandout] = useState<Handout | null>(null);
  // The phone has a share sheet; a desktop browser usually does not.
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    let active = true;
    canShareText().then((ok) => {
      if (active) setCanShare(ok);
    });
    return () => {
      active = false;
    };
  }, []);

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${what} copied`, variant: "success" });
    } catch {
      toast({ title: `Couldn't copy the ${what.toLowerCase()}`, variant: "warning" });
    }
  }

  async function share(h: Handout) {
    const text = handoutText(h.email, h.password);
    const outcome = await shareText("Your Kayv account", text);
    // A sheet that could not open is not the admin's fault; give them the
    // text another way instead of silence.
    if (outcome === "failed") await copy(text, "Details");
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
    try {
      const result = await createManagedUser(email, password, note);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setHandout({ email: email.trim().toLowerCase(), password, status: result.status });
      setEmail("");
      setPassword("");
      setNote("");
      onCreated();
    } finally {
      setCreating(false);
    }
  }

  return (
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
                    onClick={() => copy(handoutText(handout.email, handout.password), "Details")}
                  >
                    Copy both
                  </Button>
                  {canShare && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => share(handout)}>
                      Share…
                    </Button>
                  )}
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
  );
}
