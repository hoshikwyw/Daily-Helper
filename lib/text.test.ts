import { describe, expect, it } from "vitest";
import { plural } from "@/lib/text";

describe("plural", () => {
  it("uses the singular only for exactly one", () => {
    expect(plural(1, "entry", "entries")).toBe("1 entry");
    expect(plural(0, "entry", "entries")).toBe("0 entries");
    expect(plural(2, "entry", "entries")).toBe("2 entries");
  });

  it("adds an s when no plural form is given", () => {
    expect(plural(1, "day")).toBe("1 day");
    expect(plural(31, "day")).toBe("31 days");
  });
});
