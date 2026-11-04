// Supabase's auth errors are written for developers. These rewrite the ones a
// person is likely to meet into plain words, and leave anything unrecognised
// as it came. The lib/api functions apply them, so no screen sees raw text.

const NETWORK = "Couldn't reach the server. Check your connection and try again.";

function isNetwork(lower: string): boolean {
  return lower.includes("failed to fetch") || lower.includes("network");
}

function isRateLimit(lower: string): boolean {
  return (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("security purposes")
  );
}

export function friendlySignInError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "That email and password don't match. If the admin just gave them to you, check for typos or ask them to confirm.";
  }
  if (lower.includes("email not confirmed")) {
    return "Your account isn't confirmed yet. Open the confirmation email and click the link, then sign in.";
  }
  if (isRateLimit(lower)) return "Too many attempts. Wait a minute and try again.";
  if (isNetwork(lower)) return NETWORK;
  return message;
}

export function friendlyResetError(message: string): string {
  const lower = message.toLowerCase();
  if (isRateLimit(lower)) {
    return "A reset email was sent recently. Check your inbox, then wait a minute before asking again.";
  }
  if (isNetwork(lower)) return NETWORK;
  return message;
}

export function friendlyPasswordChangeError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("session missing") || lower.includes("not authenticated")) {
    return "Your sign-in has expired. Sign in again, then change the password.";
  }
  if (lower.includes("different from the old")) {
    return "That is already your password. Choose a different one.";
  }
  if (isNetwork(lower)) return NETWORK;
  return message;
}

/** For the admin creating someone else's account. */
export function friendlySignUpError(message: string): string {
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
  if (isRateLimit(lower)) return "Too many sign-ups in a short time. Wait a minute and try again.";
  if (isNetwork(lower)) return NETWORK;
  return message;
}

/** For the admin resending someone else's confirmation email. */
export function friendlyResendError(message: string): string {
  const lower = message.toLowerCase();
  if (isRateLimit(lower)) {
    return "An email was sent less than a minute ago. Ask them to check spam, then try again shortly.";
  }
  if (isNetwork(lower)) return NETWORK;
  return message;
}
