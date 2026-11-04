"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, CardFooter, CardHeader, toast } from "@kwyw/kayv-glass-ui";
import { getSession, updatePassword } from "@/lib/api/auth";
import { newPasswordProblem } from "@/lib/password";
import { NewPasswordFields } from "@/components/ui/new-password-fields";
import { FormLabel } from "@/components/ui/label";

/**
 * The signed-in account and a way to change its password. Most people get
 * their first password from the admin, so this is where they make it their
 * own.
 */
export function AccountCard() {
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    getSession().then((session) => {
      if (active) setEmail(session?.user.email ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const problem = newPasswordProblem(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    try {
      const message = await updatePassword(password);
      if (message) {
        setError(message);
        return;
      }
      setPassword("");
      setConfirm("");
      toast({ title: "Password changed", description: "Use the new one next time you sign in.", variant: "success" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card variant="elevated">
      <CardHeader title="Account" description="How you sign in" />
      <form onSubmit={handleChange}>
        <CardContent>
          <div className="space-y-4">
            <div>
              <FormLabel>Signed in as</FormLabel>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-200 truncate">
                {email ?? "…"}
              </div>
            </div>
            <NewPasswordFields
              password={password}
              confirm={confirm}
              onPasswordChange={setPassword}
              onConfirmChange={setConfirm}
            />
            {error && <Alert variant="danger">{error}</Alert>}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="primary" size="sm" type="submit" disabled={saving || !password}>
            {saving ? "Changing…" : "Change password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
