import { describe, expect, it } from "vitest";
import { delta, progressPercent, progressVariant } from "@/lib/progress";

describe("progressPercent and progressVariant", () => {
  it("rounds and guards against an empty total", () => {
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(0, 0)).toBe(0);
  });

  it("turns green only at a genuine 100%", () => {
    expect(progressVariant(99)).toBe("primary");
    expect(progressVariant(100)).toBe("success");
  });
});

describe("delta", () => {
  it("reports the direction of change", () => {
    expect(delta(6, 4)).toEqual({ diff: 2, direction: "up" });
    expect(delta(3, 5)).toEqual({ diff: -2, direction: "down" });
    expect(delta(2, 2)).toEqual({ diff: 0, direction: "same" });
  });
});
