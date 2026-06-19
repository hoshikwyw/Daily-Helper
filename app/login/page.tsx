"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

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
    <div className="w-full max-w-sm p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">✦ Orbit</h1>
        <p className="text-white/40 text-sm mt-1">
          {mode === "login" ? "Sign in to your dashboard" : "Reset your password"}
        </p>
      </div>

      {/* ── Login form ── */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm text-white/60">Password</label>
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {/* ── Forgot password form ── */}
      {mode === "forgot" && (
        <div className="space-y-4">
          {/* URL error banner (expired / invalid link) */}
          {urlErrorMessage && !resetSent && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3">
              <p className="text-amber-400 text-sm">{urlErrorMessage}</p>
            </div>
          )}

          {resetSent ? (
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                <p className="text-green-400 text-sm font-medium">Reset link sent!</p>
                <p className="text-green-400/70 text-xs mt-1">
                  Check your email at <span className="font-medium">{resetEmail}</span> and click the link to reset your password.
                </p>
              </div>
              <button
                onClick={() => switchMode("login")}
                className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-sm font-medium transition-colors"
              >
                ← Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-white/50 text-sm">
                Enter your email and we'll send you a new reset link.
              </p>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {resetError && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                  {resetError}
                </p>
              )}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? "Sending…" : "Send reset link"}
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              >
                ← Back to sign in
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Suspense fallback={
        <div className="w-full max-w-sm p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse mb-8" />
          <div className="space-y-4">
            <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-10 bg-white/10 rounded-lg animate-pulse" />
            <div className="h-10 bg-indigo-600/50 rounded-lg animate-pulse" />
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
