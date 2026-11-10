import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  GAME_CATEGORIES,
  HABIT_CATEGORIES,
  XP_BY_CATEGORY,
  WORLD_NAME_MAX,
  categoryXp,
  cleanWorldName,
  describeReward,
  isSavingsEntry,
  levelFromXp,
  levelPercent,
  xpToNextLevel,
} from "@/lib/game";

describe("xpToNextLevel", () => {
  it("grows by a fixed step from a fixed base", () => {
    expect(xpToNextLevel(1)).toBe(100);
    expect(xpToNextLevel(2)).toBe(125);
    expect(xpToNextLevel(5)).toBe(200);
  });

  it("treats anything below level 1 as level 1", () => {
    expect(xpToNextLevel(0)).toBe(100);
    expect(xpToNextLevel(-3)).toBe(100);
  });
});

describe("levelFromXp", () => {
  it("starts at level 1 with nothing earned", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, intoLevel: 0, needed: 100 });
  });

  it("stays on level 1 just below the threshold", () => {
    expect(levelFromXp(99)).toEqual({ level: 1, intoLevel: 99, needed: 100 });
  });

  it("reaches level 2 exactly at the threshold", () => {
    expect(levelFromXp(100)).toEqual({ level: 2, intoLevel: 0, needed: 125 });
  });

  it("carries the remainder across several levels", () => {
    // 100 (1→2) + 125 (2→3) = 225; 10 more sits inside level 3.
    expect(levelFromXp(235)).toEqual({ level: 3, intoLevel: 10, needed: 150 });
    // 100 + 125 + 150 + 175 = 550 → level 5 with nothing into it.
    expect(levelFromXp(550)).toEqual({ level: 5, intoLevel: 0, needed: 200 });
  });

  it("never goes down and ignores fractions and negatives", () => {
    let last = 0;
    for (let xp = 0; xp <= 2000; xp += 7) {
      const { level } = levelFromXp(xp);
      expect(level).toBeGreaterThanOrEqual(last);
      last = level;
    }
    expect(levelFromXp(-50).level).toBe(1);
    expect(levelFromXp(99.9)).toEqual(levelFromXp(99));
  });

  it("treats a broken total as zero instead of hanging or printing NaN", () => {
    expect(levelFromXp(Number.POSITIVE_INFINITY)).toEqual(levelFromXp(0));
    expect(levelFromXp(Number.NaN)).toEqual(levelFromXp(0));
  });
});

describe("levelPercent", () => {
  it("rounds the bar and clamps it", () => {
    expect(levelPercent({ level: 1, intoLevel: 0, needed: 100 })).toBe(0);
    expect(levelPercent({ level: 1, intoLevel: 33, needed: 100 })).toBe(33);
    expect(levelPercent({ level: 2, intoLevel: 124, needed: 125 })).toBe(99);
    expect(levelPercent({ level: 2, intoLevel: 999, needed: 125 })).toBe(100);
  });
});

describe("describeReward", () => {
  it("prefers the note and falls back to the source", () => {
    expect(describeReward({ source_type: "habit_check", note: "Read 20 pages", category: "learning" })).toBe(
      "Read 20 pages"
    );
    expect(describeReward({ source_type: "habit_check", note: null, category: "fitness" })).toBe("Fitness habit");
    expect(describeReward({ source_type: "task", note: null, category: "general" })).toBe("Task finished");
    expect(describeReward({ source_type: "expense", note: null, category: "savings" })).toBe("Savings entry");
  });
});

describe("isSavingsEntry", () => {
  it("is an expense filed under Savings, however it is typed", () => {
    expect(isSavingsEntry({ kind: "expense", category: "Savings" })).toBe(true);
    expect(isSavingsEntry({ kind: "expense", category: "  savings " })).toBe(true);
    expect(isSavingsEntry({ kind: undefined, category: "SAVINGS" })).toBe(true);
    expect(isSavingsEntry({ kind: "income", category: "Savings" })).toBe(false);
    expect(isSavingsEntry({ kind: "expense", category: "Emergency fund" })).toBe(false);
  });
});

describe("cleanWorldName", () => {
  it("trims, caps in whole characters, and never stores a blank", () => {
    expect(cleanWorldName("  Hoshi's Garden ")).toBe("Hoshi's Garden");
    expect(cleanWorldName("   ")).toBe("My World");
    const long = "a".repeat(WORLD_NAME_MAX) + " tail";
    expect(cleanWorldName(long)).toBe("a".repeat(WORLD_NAME_MAX));
    // 39 letters then an emoji: the emoji (two UTF-16 units) survives whole.
    const emojiEdge = "b".repeat(WORLD_NAME_MAX - 1) + "🌱x";
    expect(cleanWorldName(emojiEdge)).toBe("b".repeat(WORLD_NAME_MAX - 1) + "🌱");
    // A space landing on the cut is not kept as a trailing space.
    expect(cleanWorldName("c".repeat(WORLD_NAME_MAX - 1) + " d")).toBe("c".repeat(WORLD_NAME_MAX - 1));
  });
});

describe("categories", () => {
  it("every habit category is also a game category with a reward", () => {
    for (const h of HABIT_CATEGORIES) expect(XP_BY_CATEGORY[h.value]).toBeGreaterThan(0);
  });

  it("every category has a reward and a progress column", () => {
    for (const c of GAME_CATEGORIES) {
      expect(XP_BY_CATEGORY[c.value]).toBeGreaterThan(0);
      expect(categoryXp(EMPTY_PROGRESS, c.value)).toBe(0);
    }
    expect(categoryXp({ ...EMPTY_PROGRESS, fitness_xp: 45 }, "fitness")).toBe(45);
  });
});
