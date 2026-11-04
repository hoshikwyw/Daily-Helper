// One set of password rules for every place a password is chosen: the admin
// creating an account, a user changing their own, and the reset-link page.

/** Supabase's own floor is 6; 8 is the least that is not embarrassing. */
export const MIN_PASSWORD_LENGTH = 8;

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

/**
 * The reason a new password and its confirmation are not acceptable together,
 * or null when they are. Every screen that sets a password asks this.
 */
export function newPasswordProblem(password: string, confirm: string): string | null {
  const problem = passwordProblem(password);
  if (problem) return problem;
  if (password !== confirm) return "The two passwords don't match.";
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
