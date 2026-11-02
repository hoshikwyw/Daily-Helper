import type { ManagedUserRow } from "@/lib/types";

// Pure helpers for the admin's Users screen: validating what is typed,
// generating a password, and reading an invitation's state.

/** Supabase's own floor is 6; 8 is the least that is not embarrassing. */
export const MIN_PASSWORD_LENGTH = 8;

/** Loose but useful: something, an @, something, a dot, something. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** The reason a password is not acceptable, or null when it is. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return "Mix letters and numbers.";
  }
  return null;
}

// Unambiguous characters only: no 0/O, 1/l/I, so a password read out loud or
// written down survives the trip.
const PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * A random password that always passes `passwordProblem`. Uses the platform's
 * cryptographic random source; never Math.random.
 */
export function generatePassword(length = 12): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (n) => PASSWORD_ALPHABET[n % PASSWORD_ALPHABET.length]);
  // Guarantee the letters-and-numbers rule even for very short requests.
  if (!chars.some((c) => /\d/.test(c))) chars[0] = "7";
  if (!chars.some((c) => /[a-z]/i.test(c))) chars[1] = "k";
  return chars.join("");
}

export type ManagedUserStatus = "active" | "awaiting_confirmation" | "invited";

/**
 * Where an invitation stands: the account exists and is confirmed, exists but
 * the confirmation email has not been clicked, or does not exist yet.
 */
export function managedUserStatus(row: ManagedUserRow): ManagedUserStatus {
  if (!row.signed_up_at) return "invited";
  if (!row.confirmed_at) return "awaiting_confirmation";
  return "active";
}

export const MANAGED_USER_STATUS_LABELS: Record<ManagedUserStatus, string> = {
  active: "Active",
  awaiting_confirmation: "Awaiting email confirmation",
  invited: "Invited, no account yet",
};
