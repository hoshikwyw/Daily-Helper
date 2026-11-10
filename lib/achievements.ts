import { XP_BY_CATEGORY, levelFromXp, type GameProgress } from "@/lib/game";

// Achievements are derived from progress, never stored: a person's totals
// already say which they have earned, so there is no row to get out of step
// and nothing the browser could forge. The page remembers which ones it has
// announced, and that memory is the only state.

export type AchievementId =
  | "first-step"
  | "bookworm"
  | "on-the-move"
  | "nest-egg"
  | "finisher"
  | "level-5"
  | "level-10";

export type Achievement = {
  id: AchievementId;
  label: string;
  emoji: string;
  /** How to earn it, in the person's own vocabulary. */
  hint: string;
  earned: (progress: GameProgress) => boolean;
};

const tenLearning = XP_BY_CATEGORY.learning * 10;
const tenFitness = XP_BY_CATEGORY.fitness * 10;
const fiveSavings = XP_BY_CATEGORY.savings * 5;
const twentyEveryday = XP_BY_CATEGORY.general * 20;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    label: "First step",
    emoji: "👣",
    hint: "Earn your first XP.",
    earned: (p) => p.total_xp > 0,
  },
  {
    id: "bookworm",
    label: "Bookworm",
    emoji: "📚",
    hint: "Check a learning habit ten times.",
    earned: (p) => p.learning_xp >= tenLearning,
  },
  {
    id: "on-the-move",
    label: "On the move",
    emoji: "💪",
    hint: "Check a fitness habit ten times.",
    earned: (p) => p.fitness_xp >= tenFitness,
  },
  {
    id: "nest-egg",
    label: "Nest egg",
    emoji: "🪺",
    hint: "Add five Savings entries.",
    earned: (p) => p.savings_xp >= fiveSavings,
  },
  {
    id: "finisher",
    label: "Finisher",
    emoji: "✅",
    hint: "Finish twenty tasks or everyday habits.",
    earned: (p) => p.general_xp >= twentyEveryday,
  },
  {
    id: "level-5",
    label: "Level 5",
    emoji: "🌿",
    hint: "Reach level 5.",
    earned: (p) => levelFromXp(p.total_xp).level >= 5,
  },
  {
    id: "level-10",
    label: "Level 10",
    emoji: "🌳",
    hint: "Reach level 10.",
    earned: (p) => levelFromXp(p.total_xp).level >= 10,
  },
];

/** Ids of every achievement the progress has earned, in display order. */
export function earnedAchievements(progress: GameProgress): AchievementId[] {
  return ACHIEVEMENTS.filter((a) => a.earned(progress)).map((a) => a.id);
}

/** The achievements in `earned` not yet in `seen`: the ones to announce. */
export function newlyEarned(earned: readonly string[], seen: readonly string[]): Achievement[] {
  const seenSet = new Set(seen);
  return ACHIEVEMENTS.filter((a) => earned.includes(a.id) && !seenSet.has(a.id));
}
