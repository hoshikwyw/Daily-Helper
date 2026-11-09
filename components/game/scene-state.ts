// Everything the room needs to draw itself, as plain data. The page owns it
// and the scene only reads it, so a canvas or engine renderer could take the
// same object later without the page noticing.

export type AvatarId = "sprout";

/** What the avatar is doing. Short reactions return to "idle" on their own. */
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
