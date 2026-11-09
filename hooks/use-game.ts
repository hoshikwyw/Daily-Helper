"use client";

import { useCallback, useEffect, useState } from "react";
import { getProgress, listRecentRewards } from "@/lib/api/game";
import { EMPTY_PROGRESS, type GameProgress } from "@/lib/game";
import { onReward } from "@/lib/game-events";
import type { GameReward } from "@/lib/types";

export type GameStatus = "loading" | "ready" | "schema" | "error";

/**
 * Progress and recent rewards for the signed-in person, kept current: any
 * reward announced elsewhere in the app re-reads them. `status` tells the
 * page whether the numbers are real: "schema" means migration 007 has not
 * been applied, so the game is visible but not switched on.
 */
export function useGame(options: { withRewards?: boolean } = {}) {
  const withRewards = options.withRewards ?? true;
  const [progress, setProgress] = useState<GameProgress>(EMPTY_PROGRESS);
  const [rewards, setRewards] = useState<GameReward[]>([]);
  const [status, setStatus] = useState<GameStatus>("loading");

  const refresh = useCallback(async () => {
    const [result, recent] = await Promise.all([
      getProgress(),
      withRewards ? listRecentRewards() : Promise.resolve([]),
    ]);
    if (result.ok) {
      setProgress(result.progress);
      setRewards(recent);
      setStatus("ready");
    } else {
      setStatus(result.reason);
    }
  }, [withRewards]);

  useEffect(() => {
    // State is set only after the queries resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    return onReward(() => {
      refresh();
    });
  }, [refresh]);

  return { progress, rewards, status, refresh };
}
