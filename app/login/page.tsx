"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  Card,
  CardHeader,
  CardContent,
  Input,
  Button,
  Alert,
  GradientBackground,
  GridPattern,
} from "@kwyw/kayv-glass-ui";

type Mode = "login" | "forgot";

const URL_ERRORS: Record<string, string> = {
  expired: "Your reset link has expired. Please request a new one.",
  invalid_link: "The reset link is invalid or has already been used. Please request a new one.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // URL error (e.g. from expired reset link)
  const urlError = searchParams.get("error");
  const urlErrorMessage = urlError ? (URL_ERRORS[urlError] ?? "Something went wrong. Please try again.") : null;

  // Auto-switch to forgot mode if there's a link error
  useEffect(() => {
    if (urlError === "expired" || urlError === "invalid_link") {
      setMode("forgot");
    }
  }, [urlError]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    setResetLoading(false);
    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetError(null);
    setResetSent(false);
  }

  return (
    <Card variant="elevated" className="w-full max-w-sm">
      <CardHeader
        title="✦ Orbit"
        description={mode === "login" ? "Sign in to your dashboard" : "Reset your password"}
      />
      <CardContent>
        {/* ── Login form ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div>
              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Button type="submit" variant="primary" isLoading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        )}

        {/* ── Forgot password form ── */}
        {mode === "forgot" && (
          <div className="space-y-4">
            {/* URL error banner (expired / invalid link) */}
            {urlErrorMessage && !resetSent && (
              <Alert variant="warning">{urlErrorMessage}</Alert>
            )}

            {resetSent ? (
              <div className="space-y-4">
                <Alert variant="success" title="Reset link sent!">
                  Check your email at <span className="font-medium">{resetEmail}</span> and click the link to reset your password.
                </Alert>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => switchMode("login")}
                  className="w-full"
                >
                  ← Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <p className="text-white/50 text-sm">
                  Enter your email and we'll send you a new reset link.
                </p>
                <Input
                  label="Email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                />

                {resetError && <Alert variant="danger">{resetError}</Alert>}

                <Button type="submit" variant="primary" isLoading={resetLoading} className="w-full">
                  Send reset link
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => switchMode("login")}
                  className="w-full"
                >
                  ← Back to sign in
                </Button>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]">
      <GradientBackground fixed={false} />
      <GridPattern
        className="absolute inset-0 opacity-5 [mask-image:radial-gradient(ellipse_at_center,white_20%,transparent_70%)]"
        squares={[[1,1],[4,3],[7,2]]}
      />

      <div className="relative">
        <Suspense fallback={
          <Card variant="elevated" className="w-full max-w-sm">
            <CardContent>
              <div className="h-8 w-24 bg-white/10 rounded animate-pulse mb-8" />
              <div className="space-y-4">
                <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
                <div className="h-10 bg-indigo-600/50 rounded-lg animate-pulse" />
              </div>
            </CardContent>
          </Card>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
