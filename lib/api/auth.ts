import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { createClient, supabase } from "@/lib/supabase";
import { authCallbackUrl } from "@/lib/authRedirect";

// Auth service layer. Supabase's auth errors are shown inline (in an Alert)
// rather than as toasts, so these return the error MESSAGE instead of using
// `reportError` — null means success.

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Subscribes to sign-in/sign-out, calling `onChange` with the current session
 * (initial state included). Returns an unsubscribe function.
 *
 * Uses its own client instance so the listener is isolated from the shared
 * singleton other screens read through.
 */
export function watchSession(onChange: (session: Session | null) => void): () => void {
  const client = createClient();
  let active = true;

  client.auth.getSession().then(({ data: { session } }) => {
    if (active) onChange(session);
  });

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    if (active) onChange(session);
  });

  return () => {
    active = false;
    subscription.unsubscribe();
  };
}

/** Signs in with email + password. Returns an error message, or null on success. */
export async function signIn(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Emails a password-reset link pointing back at `/update-password`. */
export async function sendPasswordReset(email: string): Promise<string | null> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl("/update-password"),
  });
  return error?.message ?? null;
}

export async function updatePassword(password: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ password });
  return error?.message ?? null;
}

/** Why an email link failed — maps to the `?error=` code the login page reads. */
export type AuthCallbackFailure = "expired" | "invalid_link";

export type AuthCallbackResult =
  | { ok: true }
  | { ok: false; reason: AuthCallbackFailure };

/**
 * Completes an email link: a PKCE `code` exchange or a `token_hash` OTP
 * verification, whichever the link carries. The caller decides where to route.
 */
export async function completeAuthCallback(params: {
  code: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
}): Promise<AuthCallbackResult> {
  const client = createClient();

  if (params.code) {
    const { error } = await client.auth.exchangeCodeForSession(params.code);
    return error ? { ok: false, reason: "expired" } : { ok: true };
  }

  if (params.tokenHash && params.type) {
    const { error } = await client.auth.verifyOtp({
      token_hash: params.tokenHash,
      type: params.type,
    });
    return error ? { ok: false, reason: "expired" } : { ok: true };
  }

  return { ok: false, reason: "invalid_link" };
}
