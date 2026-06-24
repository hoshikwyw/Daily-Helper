"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";

// Client-side auth callback (replaces the server Route Handler). The browser
// Supabase client completes the PKCE code exchange or OTP verification using
// the verifier it stored locally, then routes onward.
function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const next = searchParams.get("next") ?? "/dashboard";
    const code = searchParams.get("code");
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    async function run() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        router.replace(error ? "/login?error=expired" : next);
        return;
      }
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });
        router.replace(error ? "/login?error=expired" : next);
        return;
      }
      router.replace("/login?error=invalid_link");
    }

    run();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-white/60 text-sm">Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
      <Callback />
    </Suspense>
  );
}
