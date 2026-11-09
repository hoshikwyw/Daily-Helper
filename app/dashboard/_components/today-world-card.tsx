"use client";

import Link from "next/link";
import { Card, CardContent } from "@kwyw/kayv-glass-ui";
import { AvatarSprite } from "@/components/game/avatar-sprite";
import { restingScene } from "@/lib/scene";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { EMPTY_PROGRESS, levelFromXp, type GameProgress } from "@/lib/game";

type TodayWorldCardProps = {
  progress?: GameProgress;
};

/** The way into My World from the Today page: the sprout, the level, one tap. */
export function TodayWorldCard({ progress = EMPTY_PROGRESS }: TodayWorldCardProps) {
  const info = levelFromXp(progress.total_xp);
  const { mood } = restingScene(useTimeOfDay());
  return (
    <Card variant="elevated">
      <CardContent>
        <Link
          href="/dashboard/world"
          className="flex items-center gap-4 -m-1 p-1 rounded-xl hover:bg-white/5 transition-colors"
        >
          <div className="shrink-0 rounded-xl bg-[#FFF6E5]/10 p-1">
            <AvatarSprite mood={mood} size={56} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-100">My World</p>
            <p className="text-xs text-slate-400">
              Level {info.level} · {progress.total_xp} XP ·{" "}
              {progress.total_xp === 0 ? "waiting for your first finished thing" : `${info.intoLevel}/${info.needed} to next`}
            </p>
          </div>
          <span aria-hidden className="text-slate-400">
            →
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
