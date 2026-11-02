import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { toast } from "@kwyw/kayv-glass-ui";
import { supabase } from "@/lib/supabase";
import { getUserId, isSchemaError, reportError, reportSchemaError } from "@/lib/db";
import type { Database, ManagedUserRow } from "@/lib/types";

// Data access for the admin's Users screen. No privileged key is involved:
// the admin adds an email to the invitation list (which only admins may write,
// by policy), then signs that email up through the ordinary public sign-up
// call; a database trigger rejects sign-ups that were not invited.

/**
 * Whether the signed-in user is an admin. Quiet on every failure: a non-admin
 * and a project without the migration both simply see no Users tab.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

/** Every invitation with the state of its account; empty for non-admins. */
export async function listManagedUsers(): Promise<ManagedUserRow[]> {
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) {
    if (!isSchemaError(error)) reportError(error);
    return [];
  }
  return data ?? [];
}

export type CreateUserResult =
  | { ok: true; status: "active" | "awaiting_confirmation" }
  | { ok: false; message: string };

/**
 * Creates an account for someone else.
 *
 * The sign-up goes through a throwaway client that never stores a session,
 * so the admin stays signed in as themselves. When the project has "Confirm
 * email" on, the new account is created but unusable until the person clicks
 * the email; the result says which.
 */
export async function createManagedUser(
  email: string,
  password: string,
  note?: string | null
): Promise<CreateUserResult> {
  const normalized = email.trim().toLowerCase();

  // Invite first. An invitation that already exists is left as it is (its
  // note and author included); one created here is withdrawn again if the
  // sign-up then fails, so a typo'd password never leaves an email open to
  // registration by whoever knows it.
  const created_by = await getUserId();
  const { data: inserted, error: inviteError } = await supabase
    .from("allowed_users")
    .upsert(
      { email: normalized, note: note?.trim() || null, created_by },
      { onConflict: "email", ignoreDuplicates: true }
    )
    .select("email");
  if (inviteError) {
    if (isSchemaError(inviteError)) {
      reportSchemaError(inviteError);
      return { ok: false, message: "The database needs updating first (see the message above)." };
    }
    if (inviteError.code === "42501") {
      return { ok: false, message: "Only an admin can create accounts." };
    }
    return { ok: false, message: inviteError.message };
  }
  const invitedJustNow = (inserted?.length ?? 0) > 0;
  const withdraw = async () => {
    if (invitedJustNow) await supabase.from("allowed_users").delete().eq("email", normalized);
  };

  // No redirect override: the confirmation email goes to someone else, who
  // may open it anywhere, so the link must be the project's public Site URL
  // rather than this device's origin or the app's deep-link scheme.
  const throwaway = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
  const { data, error } = await throwaway.auth.signUp({ email: normalized, password });
  if (error) {
    await withdraw();
    return { ok: false, message: friendlySignUpError(error.message) };
  }

  // With "Confirm email" on, Supabase answers a repeat sign-up with a user
  // that has no identities rather than an error, to avoid revealing which
  // emails exist. For the admin that is simply "already exists".
  if (data.user && data.user.identities?.length === 0) {
    await withdraw();
    return { ok: false, message: "An account with this email already exists." };
  }

  const confirmed = !!data.session || !!data.user?.email_confirmed_at;
  return { ok: true, status: confirmed ? "active" : "awaiting_confirmation" };
}

function friendlySignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists.";
  }
  if (lower.includes("password")) return message;
  if (lower.includes("database error")) {
    // GoTrue hides the real text (a trigger or constraint on auth.users)
    // behind this line, so there is nothing more specific to say.
    return "The database refused the sign-up. Check the Supabase logs for the reason.";
  }
  if (lower.includes("signups not allowed") || lower.includes("sign-ups not allowed")) {
    return "Email sign-ups are disabled in the Supabase dashboard (Authentication → Providers → Email).";
  }
  return message;
}

/**
 * Removes an invitation so that email can no longer sign up. An account that
 * already exists keeps working: deleting it needs the service key, which the
 * app deliberately does not have.
 */
export async function revokeInvitation(email: string): Promise<boolean> {
  // A delete that matches nothing (filtered by policy, or already gone) is
  // not an error to PostgREST, so count the rows rather than trust silence.
  const { data, error } = await supabase
    .from("allowed_users")
    .delete()
    .eq("email", email)
    .select("email");
  if (reportError(error)) return false;
  if (!data || data.length === 0) {
    toast({ title: "Nothing removed", description: "That invitation was already gone.", variant: "warning" });
    return false;
  }
  return true;
}
