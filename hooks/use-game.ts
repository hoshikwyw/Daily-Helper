"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROFILE, getProfile, getProgress, listRecentRewards, type GameProfile } from "@/lib/api/game";
import { getUserId } from "@/lib/db";
import { EMPTY_PROGRESS, type GameProgress } from "@/lib/game";
import { onReward } from "@/lib/game-events";
import type { GameReward } from "@/lib/types";

export type GameStatus = "loading" | "ready" | "schema" | "error";

function sameProgress(a: GameProgress, b: GameProgress): boolean {
  return (
    a.total_xp === b.total_xp &&
    a.learning_xp === b.learning_xp &&
    a.fitness_xp === b.fitness_xp &&
    a.savings_xp === b.savings_xp &&
    a.general_xp === b.general_xp
  );
}

function sameRewards(a: GameReward[], b: GameReward[]): boolean {
  return a.length === b.length && a.every((r, i) => r.id === b[i].id);
}

/**
 * Progress, profile, and recent rewards for the signed-in person. Progress
 * and rewards are re-read whenever a reward is announced elsewhere in the
 * app, and keep their identity when nothing changed, so effects that depend
 * on them run only on a real change. The profile is read once: a reward
 * cannot change it, and `setProfile` takes the saved row after a customise.
 *
 * `status` says whether the numbers are real: "schema" means the reward
 * migrations have not been applied. `profileStatus` is separate so that a
 * missing 009 leaves the numbers visible and only customising unavailable.
 */
export function useGame(options: { withRewards?: boolean } = {}) {
  const withRewards = options.withRewards ?? true;
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [profile, setProfile] = useState<GameProfile>(DEFAULT_PROFILE);
  const [profileStatus, setProfileStatus] = useState<GameStatus>("loading");
  const [rewards, setRewards] = useState<GameReward[]>([]);
  const [status, setStatus] = useState<GameStatus>("loading");

  const refresh = useCallback(async () => {
    const [totals, recent] = await Promise.all([
      getProgress(),
      withRewards ? listRecentRewards() : Promise.resolve([]),
    ]);
    if (!totals.ok) {
      setStatus(totals.reason);
      return;
    }
    setProgress((prev) => (sameProgress(prev, totals.progress) ? prev : totals.progress));
    setRewards((prev) => (sameRewards(prev, recent) ? prev : recent));
    setStatus("ready");
  }, [withRewards]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getUserId(), getProfile()]).then(([id, who]) => {
      if (cancelled) return;
      setUserId(id);
      if (who.ok) setProfile(who.profile);
      setProfileStatus(who.ok ? "ready" : who.reason);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // State is set only after the queries resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    return onReward(() => {
      refresh();
    });
  }, [refresh]);

  return { userId, progress, profile, profileStatus, rewards, status, refresh, setProfile };
}
