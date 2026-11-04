import type { ManagedUserRow } from "@/lib/types";

// Pure helpers for the admin's Users screen: validating what is typed and
// reading an invitation's state. Password rules live in lib/password.ts,
// shared with the screens where a person changes their own.

/** Loose but useful: something, an @, something, a dot, something. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
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

/** The text the admin hands over, as one message. */
export function handoutText(email: string, password: string): string {
  return `Email: ${email}\nPassword: ${password}`;
}
