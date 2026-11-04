import { describe, expect, it } from "vitest";
import {
  friendlyPasswordChangeError,
  friendlyResendError,
  friendlyResetError,
  friendlySignInError,
  friendlySignUpError,
} from "@/lib/auth-messages";

describe("friendlySignInError", () => {
  it("rewrites the errors a person meets on the sign-in screen", () => {
    expect(friendlySignInError("Invalid login credentials")).toMatch(/don't match/);
    expect(friendlySignInError("Email not confirmed")).toMatch(/confirmation email/);
    expect(friendlySignInError("Request rate limit reached")).toMatch(/Too many attempts/);
    expect(friendlySignInError("TypeError: Failed to fetch")).toMatch(/connection/);
  });

  it("leaves anything else as it came", () => {
    expect(friendlySignInError("Something unusual")).toBe("Something unusual");
  });
});

describe("friendlyResetError", () => {
  it("explains the cool-down instead of quoting it", () => {
    expect(
      friendlyResetError("For security purposes, you can only request this after 59 seconds.")
    ).toMatch(/sent recently/);
    expect(friendlyResetError("Odd")).toBe("Odd");
  });
});

describe("friendlyPasswordChangeError", () => {
  it("explains an expired session and a repeated password", () => {
    expect(friendlyPasswordChangeError("Auth session missing!")).toMatch(/Sign in again/);
    expect(
      friendlyPasswordChangeError("New password should be different from the old password.")
    ).toMatch(/already your password/);
  });
});

describe("friendlySignUpError", () => {
  it("covers the admin's common cases", () => {
    expect(friendlySignUpError("User already registered")).toMatch(/already exists/);
    expect(friendlySignUpError("Database error saving new user")).toMatch(/Supabase logs/);
    expect(friendlySignUpError("Signups not allowed for this instance")).toMatch(/disabled/);
    expect(friendlySignUpError("Password should be at least 6 characters")).toMatch(/Password/);
  });
});

describe("friendlyResendError", () => {
  it("turns the rate limit into advice", () => {
    expect(friendlyResendError("For security purposes, you can only request this after 30 seconds."))
      .toMatch(/less than a minute/);
    expect(friendlyResendError("Failed to fetch")).toMatch(/connection/);
  });
});
