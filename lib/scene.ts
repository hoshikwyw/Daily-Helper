import type { GameCategory } from "@/lib/game";
import type { UnlockKey } from "@/lib/unlocks";

// Pure state for the My World room: what time it is, who lives there, what
// the avatar is doing, and which reaction a reward should play. The
// components only draw this; nothing here knows about React or the DOM.

/** The starter avatars. The id is what game_profiles stores. */
export type AvatarId = "sprout" | "bloom" | "shroom";

export const AVATARS: { id: AvatarId; label: string; blurb: string }[] = [
  { id: "sprout", label: "Sprout", blurb: "A seedling with two leaves. Steady and green." },
  { id: "bloom", label: "Bloom", blurb: "A flower bud that opens as the days add up." },
  { id: "shroom", label: "Shroom", blurb: "A small mushroom, happiest in a quiet room." },
];

export const DEFAULT_AVATAR: AvatarId = "sprout";

/** The stored id, or the default for anything this build does not draw. */
export function toAvatarId(value: string | null | undefined): AvatarId {
  return AVATARS.some((a) => a.id === value) ? (value as AvatarId) : DEFAULT_AVATAR;
}

export function avatarLabel(id: AvatarId): string {
  return AVATARS.find((a) => a.id === id)?.label ?? "Sprout";
}

/** What the avatar is doing. Reactions return to the resting mood on their own. */
export type AvatarMood = "idle" | "happy" | "celebrate" | "reading" | "exercise" | "sleep";

export type TimeOfDay = "day" | "night";

export type SceneState = {
  avatar: AvatarId;
  mood: AvatarMood;
  timeOfDay: TimeOfDay;
  /** Decorations the room shows; see lib/unlocks.ts. */
  unlocked: UnlockKey[];
};

/** Night from 21:00 to 05:59 local time; the avatar sleeps then. */
export function timeOfDayAt(now: Date): TimeOfDay {
  const h = now.getHours();
  return h >= 21 || h < 6 ? "night" : "day";
}

/** The resting scene for a time of day, before any reward plays. */
export function restingScene(
  timeOfDay: TimeOfDay,
  options: { avatar?: AvatarId; unlocked?: UnlockKey[] } = {}
): SceneState {
  return {
    avatar: options.avatar ?? DEFAULT_AVATAR,
    mood: timeOfDay === "night" ? "sleep" : "idle",
    timeOfDay,
    unlocked: options.unlocked ?? [],
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
