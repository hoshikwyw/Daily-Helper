"use client";

import Link from "next/link";
import { Card, CardContent } from "@kwyw/kayv-glass-ui";
import { AvatarSprite } from "@/components/game/avatar-sprite";
import { restingScene } from "@/lib/scene";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { useGame } from "@/hooks/use-game";
import { levelFromXp } from "@/lib/game";

/** The way into My World from the Today page: the avatar, the level, one tap. */
export function TodayWorldCard() {
  // Totals only; the history list belongs to the full page. Re-reads itself
  // when a habit check on this page earns a reward.
  const { progress, profile, status } = useGame({ withRewards: false });
  const info = levelFromXp(progress.total_xp);
  const { mood } = restingScene(useTimeOfDay());

  const line = {
    loading: "…",
    schema: "Not switched on yet",
    error: "Couldn't load progress",
    ready:
      progress.total_xp === 0
        ? `Level ${info.level} · waiting for your first checked habit`
        : `Level ${info.level} · ${progress.total_xp} XP · ${info.intoLevel}/${info.needed} to next`,
  }[status];

  return (
    <Card variant="elevated">
      <CardContent>
        <Link
          href="/dashboard/world"
          className="flex items-center gap-4 -m-1 p-1 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="shrink-0 rounded-xl bg-[#FFF6E5]/10 p-1">
            <AvatarSprite avatar={profile.avatar_id} mood={mood} size={56} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-100 truncate">{profile.world_name}</p>
            <p className="text-xs text-slate-400 truncate">{line}</p>
          </div>
          <span aria-hidden className="text-slate-400">
            →
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
