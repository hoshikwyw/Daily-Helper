import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, generatePassword, passwordProblem } from "@/lib/password";

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
