import { describe, expect, it } from "vitest";
import { handoutText, isValidEmail, managedUserStatus } from "@/lib/admin";
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

describe("handoutText", () => {
  it("puts email and password on their own lines", () => {
    expect(handoutText("a@b.co", "pw12345k")).toBe("Email: a@b.co\nPassword: pw12345k");
  });
});
