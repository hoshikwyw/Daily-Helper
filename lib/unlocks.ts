// Room decorations that appear as the level rises. Pure data: the room draws
// whatever keys are unlocked, and the panel says what comes next. Nothing is
// stored; a level is a function of XP, so unlocks are too.

export type UnlockKey = "lights" | "cat" | "globe";

export type RoomUnlock = {
  key: UnlockKey;
  label: string;
  /** The level at which it appears. */
  level: number;
  blurb: string;
};

export const ROOM_UNLOCKS: RoomUnlock[] = [
  { key: "lights", label: "Fairy lights", level: 2, blurb: "A string of warm bulbs above the window." },
  { key: "cat", label: "A cat", level: 3, blurb: "Moves in and claims the bed." },
  { key: "globe", label: "Desk globe", level: 5, blurb: "For all the places you are heading." },
];

/** Keys of everything unlocked at or below `level`, in unlock order. */
export function unlockedAt(level: number): UnlockKey[] {
  return ROOM_UNLOCKS.filter((u) => u.level <= level).map((u) => u.key);
}

/** The first decoration still locked at `level`, or null when the room is full. */
export function nextUnlock(level: number): RoomUnlock | null {
  return ROOM_UNLOCKS.find((u) => u.level > level) ?? null;
}

/** The labels as one lower-case phrase: "fairy lights, a cat, and desk globe". */
export function describeUnlocks(unlocks: readonly RoomUnlock[]): string {
  const names = unlocks.map((u) => u.label.toLowerCase());
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/** Decorations that appear when climbing from `fromLevel` to `toLevel`. */
export function unlocksBetween(fromLevel: number, toLevel: number): RoomUnlock[] {
  return ROOM_UNLOCKS.filter((u) => u.level > fromLevel && u.level <= toLevel);
}
