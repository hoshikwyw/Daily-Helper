"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardContent,
  Input,
  Button,
  Alert,
} from "@kwyw/kayv-glass-ui";
import { AuthLayout } from "@/components/ui/auth-layout";

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

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
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
        <CardHeader title="✦ Orbit" description="Set a new password" />
        <CardContent>
          {done ? (
            <Alert variant="success" title="Password updated!">
              Redirecting you to the dashboard…
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
              <Input
                label="Confirm password"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                minLength={6}
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
