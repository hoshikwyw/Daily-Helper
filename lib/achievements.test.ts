import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, earnedAchievements, newlyEarned } from "@/lib/achievements";
import { EMPTY_PROGRESS, XP_BY_CATEGORY } from "@/lib/game";

const progress = (patch: Partial<typeof EMPTY_PROGRESS>) => ({ ...EMPTY_PROGRESS, ...patch });

describe("earnedAchievements", () => {
  it("awards nothing to a fresh world", () => {
    expect(earnedAchievements(EMPTY_PROGRESS)).toEqual([]);
  });

  it("gives the first step for any XP at all", () => {
    expect(earnedAchievements(progress({ total_xp: 5, general_xp: 5 }))).toEqual(["first-step"]);
  });

  it("counts category thresholds in whole checks", () => {
    const nineLearning = XP_BY_CATEGORY.learning * 9;
    expect(earnedAchievements(progress({ total_xp: nineLearning, learning_xp: nineLearning }))).not.toContain(
      "bookworm"
    );
    const tenLearning = XP_BY_CATEGORY.learning * 10;
    expect(earnedAchievements(progress({ total_xp: tenLearning, learning_xp: tenLearning }))).toContain("bookworm");
    const fiveSavings = XP_BY_CATEGORY.savings * 5;
    expect(earnedAchievements(progress({ total_xp: fiveSavings, savings_xp: fiveSavings }))).toContain("nest-egg");
  });

  it("marks the level milestones from total XP alone", () => {
    // 100 + 125 + 150 + 175 = 550 is the first XP at level 5.
    expect(earnedAchievements(progress({ total_xp: 549 }))).not.toContain("level-5");
    expect(earnedAchievements(progress({ total_xp: 550 }))).toContain("level-5");
    expect(earnedAchievements(progress({ total_xp: 550 }))).not.toContain("level-10");
  });

  it("has unique ids and a hint for each", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.hint.length).toBeGreaterThan(0);
  });
});

describe("newlyEarned", () => {
  it("returns only what has not been announced, in display order", () => {
    const earned = earnedAchievements(progress({ total_xp: 550, learning_xp: 550 }));
    expect(earned).toEqual(["first-step", "bookworm", "level-5"]);
    expect(newlyEarned(earned, ["first-step"]).map((a) => a.id)).toEqual(["bookworm", "level-5"]);
    expect(newlyEarned(earned, earned)).toEqual([]);
    expect(newlyEarned(earned, ["something-old"]).map((a) => a.id)).toEqual(earned);
  });
});
