"use client";

import { Badge, Card, CardContent, CardHeader, Progress } from "@kwyw/kayv-glass-ui";
import {
  GAME_CATEGORIES,
  XP_BY_CATEGORY,
  categoryXp,
  describeReward,
  levelFromXp,
  levelPercent,
  type GameProgress,
} from "@/lib/game";
import { formatMonthDay } from "@/lib/date";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel } from "@/components/ui/label";
import { SkeletonList } from "@/components/ui/skeleton";
import type { GameReward } from "@/lib/types";

type ProgressPanelProps = {
  progress: GameProgress;
  rewards: GameReward[];
  /** True while the first read is in flight. */
  loading?: boolean;
  /**
   * False while rewards are not wired to the database. The category hints
   * and the "how XP is earned" copy describe things a person can do, so they
   * stay hidden until doing them has an effect.
   */
  connected: boolean;
};

/**
 * The numbers behind the room, always in text as well as bars, so the game is
 * readable without the scene and without motion.
 */
export function ProgressPanel({ progress, rewards, loading = false, connected }: ProgressPanelProps) {
  const info = levelFromXp(progress.total_xp);
  return (
    <Card variant="elevated">
      <CardHeader title={`Level ${info.level}`} description="Every real thing you finish grows this." />
      <CardContent>
        <div className="space-y-5">
          {/* The library names the bar from `label`, so the XP text is both
              visible and announced. */}
          <Progress
            value={levelPercent(info)}
            size="md"
            label={`${info.intoLevel} of ${info.needed} XP to level ${info.level + 1}`}
          />

          <div>
            <FieldLabel>By category</FieldLabel>
            <ul className="space-y-2">
              {GAME_CATEGORIES.map((c) => (
                <li key={c.value} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                  <span role="img" aria-label={c.label} className="text-lg leading-none">
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-200">{c.label}</p>
                    {connected && <p className="text-xs text-slate-400 truncate">{c.hint}</p>}
                  </div>
                  <Badge size="sm" variant="default">
                    {categoryXp(progress, c.value)} XP
                  </Badge>
                </li>
              ))}
            </ul>
          </div>

          {connected ? (
            <div>
              <FieldLabel>How XP is earned</FieldLabel>
              <p className="text-sm text-slate-400">
                Each finished thing counts once: a learning habit is {XP_BY_CATEGORY.learning} XP,
                a fitness habit {XP_BY_CATEGORY.fitness}, a savings entry {XP_BY_CATEGORY.savings},
                and any task or other habit {XP_BY_CATEGORY.general}. Nothing is ever taken away,
                and missing a day costs nothing.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Rewards are not switched on yet. When they are, each finished thing will count once,
              nothing will ever be taken away, and missing a day will cost nothing.
            </p>
          )}

          <div>
            <FieldLabel>Recent rewards</FieldLabel>
            {loading ? (
              <SkeletonList count={3} />
            ) : rewards.length === 0 ? (
              <EmptyState padding="md">
                {connected ? "Nothing yet. Your first checked habit will show up here." : "Nothing yet."}
              </EmptyState>
            ) : (
              <ul className="space-y-1.5">
                {rewards.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-slate-200">{describeReward(r)}</span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {formatMonthDay(new Date(r.created_at))}
                    </span>
                    <Badge size="sm" variant="success">
                      +{r.xp}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
