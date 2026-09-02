"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { completeAuthCallback } from "@/lib/api/auth";
import type { EmailOtpType } from "@supabase/supabase-js";

// Client-side auth callback (replaces the server Route Handler). The browser
// Supabase client completes the PKCE code exchange or OTP verification using
// the verifier it stored locally, then routes onward.
function Callback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") ?? "/dashboard";

    completeAuthCallback({
      code: searchParams.get("code"),
      tokenHash: searchParams.get("token_hash"),
      type: searchParams.get("type") as EmailOtpType | null,
    }).then((result) => {
      router.replace(result.ok ? next : `/login?error=${result.reason}`);
    });
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
