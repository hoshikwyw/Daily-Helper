import type { GameCategory } from "@/lib/game";

// Pure state for the My World room: what time it is, what the avatar is
// doing, and which reaction a reward should play. The components only draw
// this; nothing here knows about React or the DOM.

export type AvatarId = "sprout";

/** What the avatar is doing. Reactions return to the resting mood on their own. */
export type AvatarMood = "idle" | "happy" | "celebrate" | "reading" | "exercise" | "sleep";

export type TimeOfDay = "day" | "night";

export type SceneState = {
  avatar: AvatarId;
  mood: AvatarMood;
  timeOfDay: TimeOfDay;
  /** Keys of unlocked decorations; empty until unlocks exist. */
  unlocked: string[];
};

/** Night from 21:00 to 05:59 local time; the avatar sleeps then. */
export function timeOfDayAt(now: Date): TimeOfDay {
  const h = now.getHours();
  return h >= 21 || h < 6 ? "night" : "day";
}

/** The resting scene for a time of day, before any reward plays. */
export function restingScene(timeOfDay: TimeOfDay): SceneState {
  return {
    avatar: "sprout",
    mood: timeOfDay === "night" ? "sleep" : "idle",
    timeOfDay,
    unlocked: [],
  };
}

/** The moods that are short reactions rather than resting states. */
export type Reaction = Exclude<AvatarMood, "idle" | "sleep">;

/** How long each reaction holds before the avatar settles again. */
export const REACTION_MS: Record<Reaction, number> = {
  happy: 1800,
  celebrate: 2800,
  reading: 2600,
  exercise: 2600,
};

/** Which reaction a reward in a category plays. Level-ups are separate. */
export function reactionFor(category: GameCategory): Reaction {
  switch (category) {
    case "learning":
      return "reading";
    case "fitness":
      return "exercise";
    case "savings":
    case "general":
      return "happy";
  }
}

/** Whether sparkles accompany a mood. */
export function sparklesFor(mood: AvatarMood): boolean {
  return mood === "happy" || mood === "celebrate";
}
