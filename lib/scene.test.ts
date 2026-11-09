import { describe, expect, it } from "vitest";
import { GAME_CATEGORIES } from "@/lib/game";
import { REACTION_MS, reactionFor, restingScene, sparklesFor, timeOfDayAt } from "@/lib/scene";

describe("timeOfDayAt", () => {
  it("is night from 21:00 through 05:59 and day otherwise", () => {
    const at = (h: number, m = 0) => timeOfDayAt(new Date(2026, 10, 9, h, m));
    expect(at(21)).toBe("night");
    expect(at(23, 59)).toBe("night");
    expect(at(0)).toBe("night");
    expect(at(5, 59)).toBe("night");
    expect(at(6)).toBe("day");
    expect(at(12)).toBe("day");
    expect(at(20, 59)).toBe("day");
  });
});

describe("restingScene", () => {
  it("sleeps at night and idles by day", () => {
    expect(restingScene("night").mood).toBe("sleep");
    expect(restingScene("day").mood).toBe("idle");
    expect(restingScene("day").unlocked).toEqual([]);
  });
});

describe("reactionFor", () => {
  it("gives every category a reaction with a duration", () => {
    for (const c of GAME_CATEGORIES) {
      const r = reactionFor(c.value);
      expect(REACTION_MS[r]).toBeGreaterThan(0);
    }
    expect(reactionFor("learning")).toBe("reading");
    expect(reactionFor("fitness")).toBe("exercise");
  });
});

describe("sparklesFor", () => {
  it("sparkles only on the pleased moods", () => {
    expect(sparklesFor("happy")).toBe(true);
    expect(sparklesFor("celebrate")).toBe(true);
    expect(sparklesFor("reading")).toBe(false);
    expect(sparklesFor("sleep")).toBe(false);
  });
});
