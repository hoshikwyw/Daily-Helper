import { describe, expect, it } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  generatePassword,
  isValidEmail,
  managedUserStatus,
  passwordProblem,
} from "@/lib/admin";
import type { ManagedUserRow } from "@/lib/types";

describe("isValidEmail", () => {
  it("accepts ordinary addresses and trims whitespace", () => {
    expect(isValidEmail("someone@example.com")).toBe(true);
    expect(isValidEmail("  first.last@sub.example.co  ")).toBe(true);
  });

  it("rejects obvious non-addresses", () => {
    for (const bad of ["", "nope", "no@tld", "@example.com", "a b@example.com"]) {
      expect(isValidEmail(bad)).toBe(false);
    }
  });
});

describe("passwordProblem", () => {
  it("wants length and a mix of letters and numbers", () => {
    expect(passwordProblem("short1")).toMatch(/at least/);
    expect(passwordProblem("onlyletters")).toMatch(/letters and numbers/);
    expect(passwordProblem("12345678")).toMatch(/letters and numbers/);
    expect(passwordProblem("letters12")).toBeNull();
  });
});

describe("generatePassword", () => {
  it("makes passwords of the requested length that pass the checks", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword();
      expect(pw).toHaveLength(12);
      expect(passwordProblem(pw)).toBeNull();
    }
    expect(generatePassword(MIN_PASSWORD_LENGTH)).toHaveLength(MIN_PASSWORD_LENGTH);
  });

  it("avoids look-alike characters", () => {
    const sample = Array.from({ length: 30 }, () => generatePassword(20)).join("");
    expect(sample).not.toMatch(/[0O1lI]/);
  });

  it("does not repeat itself", () => {
    expect(generatePassword()).not.toBe(generatePassword());
  });
});

describe("managedUserStatus", () => {
  const base: ManagedUserRow = {
    email: "x@example.com",
    note: null,
    invited_at: "2026-11-01T00:00:00Z",
    signed_up_at: null,
    confirmed_at: null,
    last_sign_in_at: null,
  };

  it("reads the three states from the joined row", () => {
    expect(managedUserStatus(base)).toBe("invited");
    expect(managedUserStatus({ ...base, signed_up_at: "2026-11-02T00:00:00Z" })).toBe(
      "awaiting_confirmation"
    );
    expect(
      managedUserStatus({
        ...base,
        signed_up_at: "2026-11-02T00:00:00Z",
        confirmed_at: "2026-11-02T00:01:00Z",
      })
    ).toBe("active");
  });
});
