import type { GameReward } from "@/lib/types";

// A one-topic event bus for "the database just awarded XP". The place that
// learns about a reward (announceReward, after a habit check) tells everyone
// who is showing progress, so the Today card and the room update without a
// reload and without each of them polling.

type Listener = (reward: GameReward) => void;

const listeners = new Set<Listener>();

export function onReward(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitReward(reward: GameReward): void {
  for (const listener of listeners) listener(reward);
}
