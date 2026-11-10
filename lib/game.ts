// Pure rules for My World (working name "Consistency Garden"): what earns XP,
// how XP turns into a level, and the shape of a user's progress. Nothing here
// touches the network or the DOM, so every rule is unit-tested in isolation.
//
// The numbers are starting values. They live only here on the client and in
// the reward triggers in the database; no component carries its own copy.

import { progressPercent } from "@/lib/progress";
import type { GameReward, HabitCategory } from "@/lib/types";

export type GameCategory = "learning" | "fitness" | "savings" | "general";

export const GAME_CATEGORIES: {
  value: GameCategory;
  label: string;
  emoji: string;
  /** How a person earns it, in their own vocabulary. */
  hint: string;
}[] = [
  { value: "learning", label: "Learning", emoji: "📚", hint: "Check a habit you have marked as learning." },
  { value: "fitness", label: "Fitness", emoji: "💪", hint: "Check a habit you have marked as fitness." },
  { value: "savings", label: "Savings", emoji: "🌱", hint: "Add a Money entry in the Savings category." },
  { value: "general", label: "Everyday", emoji: "✅", hint: "Finish a task, or check any other habit." },
];

/** The choices a habit offers, in chip order; "general" is every habit's default. */
const HABIT_CATEGORY_ORDER: HabitCategory[] = ["general", "learning", "fitness"];
export const HABIT_CATEGORIES = HABIT_CATEGORY_ORDER.map((value) => {
  const c = GAME_CATEGORIES.find((g) => g.value === value)!;
  return { value, label: c.label, emoji: c.emoji };
});

/** The expense category that counts as money set aside. Matched case-insensitively, as the trigger does. */
export const SAVINGS_CATEGORY = "Savings";

/** Whether a money entry is a savings contribution: an outflow filed under Savings. */
export function isSavingsEntry(entry: { kind: string | null | undefined; category: string }): boolean {
  return (
    (entry.kind ?? "expense") === "expense" &&
    entry.category.trim().toLowerCase() === SAVINGS_CATEGORY.toLowerCase()
  );
}

/** XP for one validated event in each category. Fixed; never scaled by amounts. */
export const XP_BY_CATEGORY: Record<GameCategory, number> = {
  learning: 10,
  fitness: 15,
  savings: 10,
  general: 5,
};

/** XP needed to climb from level 1 to level 2. */
export const BASE_LEVEL_XP = 100;
/** Each later level needs this much more than the one before. */
export const LEVEL_STEP_XP = 25;

/**
 * XP needed to go from `level` to `level + 1`. This is the size of one rung,
 * not a cumulative threshold: 100 for level 1, 125 for level 2, 150 for 3.
 */
export function xpToNextLevel(level: number): number {
  return BASE_LEVEL_XP + (Math.max(1, level) - 1) * LEVEL_STEP_XP;
}

export type LevelInfo = {
  level: number;
  /** XP earned within the current level. */
  intoLevel: number;
  /** XP the current level needs in total; `intoLevel / needed` is the bar. */
  needed: number;
};

/**
 * The single authoritative way to turn total XP into a level. Levels are not
 * stored anywhere, so there is nothing that can disagree with this.
 */
export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  // A bad row (NaN, Infinity) must not spin this loop or print "NaN XP".
  let remaining = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  while (remaining >= xpToNextLevel(level)) {
    remaining -= xpToNextLevel(level);
    level += 1;
  }
  return { level, intoLevel: remaining, needed: xpToNextLevel(level) };
}

/** Progress as the database will report it: totals per category. */
export type GameProgress = {
  total_xp: number;
  learning_xp: number;
  fitness_xp: number;
  savings_xp: number;
  general_xp: number;
};

export const EMPTY_PROGRESS: GameProgress = {
  total_xp: 0,
  learning_xp: 0,
  fitness_xp: 0,
  savings_xp: 0,
  general_xp: 0,
};

export function categoryXp(progress: GameProgress, category: GameCategory): number {
  return progress[`${category}_xp`];
}

/** One line for the history list: what was done, in the person's words. */
export function describeReward(reward: Pick<GameReward, "source_type" | "note" | "category">): string {
  const label = GAME_CATEGORIES.find((c) => c.value === reward.category)?.label ?? "Reward";
  if (reward.note) return reward.note;
  switch (reward.source_type) {
    case "habit_check":
      return `${label} habit`;
    case "task":
      return "Task finished";
    case "expense":
      return "Savings entry";
  }
}

/** Percent of the current level completed, clamped to 0–100 for a bar. */
export function levelPercent(info: LevelInfo): number {
  return Math.min(100, Math.max(0, progressPercent(info.intoLevel, info.needed)));
}
