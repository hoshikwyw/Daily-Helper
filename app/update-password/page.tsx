"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/lib/api/auth";
import { newPasswordProblem } from "@/lib/password";
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  Alert,
} from "@kwyw/kayv-glass-ui";
import { AuthLayout } from "@/components/ui/auth-layout";
import { NewPasswordFields } from "@/components/ui/new-password-fields";
import { Logo } from "@/components/ui/logo";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const problem = newPasswordProblem(password, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setLoading(true);
    const message = await updatePassword(password);

    if (message) {
      setError(message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  }

  return (
    <AuthLayout>
      <Card variant="elevated" className="w-full max-w-sm">
        <div className="mb-4">
          <Logo size="lg" />
        </div>
        <CardHeader title="Choose a new password" description="Set a new password" />
        <CardContent>
          {done ? (
            <Alert variant="success" title="Password updated!">
              Redirecting you to the dashboard…
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <NewPasswordFields
                required
                password={password}
                confirm={confirm}
                onPasswordChange={setPassword}
                onConfirmChange={setConfirm}
              />

              {error && <Alert variant="danger">{error}</Alert>}

              <Button type="submit" variant="primary" isLoading={loading} className="w-full">
                Update password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
