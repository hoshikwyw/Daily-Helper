import { describe, expect, it } from "vitest";
import { ROOM_UNLOCKS, describeUnlocks, nextUnlock, unlockedAt, unlocksBetween } from "@/lib/unlocks";

describe("room unlocks", () => {
  it("are listed in rising level order with distinct keys", () => {
    const levels = ROOM_UNLOCKS.map((u) => u.level);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
    expect(new Set(ROOM_UNLOCKS.map((u) => u.key)).size).toBe(ROOM_UNLOCKS.length);
    for (const u of ROOM_UNLOCKS) expect(u.level).toBeGreaterThan(1);
  });

  it("start empty and fill as the level rises", () => {
    expect(unlockedAt(1)).toEqual([]);
    expect(unlockedAt(2)).toEqual(["lights"]);
    expect(unlockedAt(3)).toEqual(["lights", "cat"]);
    expect(unlockedAt(99)).toEqual(ROOM_UNLOCKS.map((u) => u.key));
  });

  it("name the next one until the room is full", () => {
    expect(nextUnlock(1)?.key).toBe("lights");
    expect(nextUnlock(2)?.key).toBe("cat");
    expect(nextUnlock(99)).toBeNull();
  });

  it("read as a sentence however many there are", () => {
    expect(describeUnlocks([])).toBe("");
    expect(describeUnlocks(ROOM_UNLOCKS.slice(0, 1))).toBe("fairy lights");
    expect(describeUnlocks(ROOM_UNLOCKS.slice(0, 2))).toBe("fairy lights and a cat");
    expect(describeUnlocks(ROOM_UNLOCKS)).toBe("fairy lights, a cat, and desk globe");
  });

  it("report everything gained across a jump of several levels", () => {
    expect(unlocksBetween(1, 1)).toEqual([]);
    expect(unlocksBetween(1, 2).map((u) => u.key)).toEqual(["lights"]);
    expect(unlocksBetween(1, 5).map((u) => u.key)).toEqual(["lights", "cat", "globe"]);
    expect(unlocksBetween(3, 4)).toEqual([]);
  });
});
