"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REACTION_MS, restingScene, type AvatarId, type Reaction, type SceneState } from "@/lib/scene";
import type { UnlockKey } from "@/lib/unlocks";
import { useTimeOfDay } from "@/hooks/use-time-of-day";

type Playing = { mood: Reaction; key: number };

/**
 * The room's state over time: the resting scene for the hour, with the chosen
 * avatar and the level's decorations, plus short reactions layered on top
 * that clear themselves. A reaction arriving while another plays replaces it
 * and restarts the sparkles.
 */
export function useScene(options: { avatar: AvatarId; unlocked: UnlockKey[] }): {
  scene: SceneState;
  burstKey: number;
  react: (mood: Reaction) => void;
} {
  const timeOfDay = useTimeOfDay();
  const [playing, setPlaying] = useState<Playing | null>(null);
  const timer = useRef<number | null>(null);

  const react = useCallback((mood: Reaction) => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setPlaying((prev) => ({ mood, key: (prev?.key ?? 0) + 1 }));
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPlaying(null);
    }, REACTION_MS[mood]);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const resting = restingScene(timeOfDay, options);
  return {
    scene: playing ? { ...resting, mood: playing.mood } : resting,
    burstKey: playing?.key ?? 0,
    react,
  };
}
