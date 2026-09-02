import { Card, CardHeader, CardContent, Progress, Badge } from "@kwyw/kayv-glass-ui";
import { MOOD_META } from "@/lib/constants";
import { progressPercent, progressVariant } from "@/lib/progress";
import type { Mood } from "@/lib/types";

type TodaySummaryCardsProps = {
  done: number;
  total: number;
  projectCount: number;
  loading: boolean;
  /** "" while no mood has been recorded for today. */
  mood: string;
};

export function TodaySummaryCards({
  done,
  total,
  projectCount,
  loading,
  mood,
}: TodaySummaryCardsProps) {
  const percent = progressPercent(done, total);
  const variant = progressVariant(percent);
  const moodMeta = mood ? MOOD_META[mood as Mood] : null;

  return (
    <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card variant="elevated">
        <CardHeader title="Today's Tasks" />
        <CardContent>
          <div className="flex items-end justify-between mb-3">
            <span className="text-3xl font-bold text-white">
              {done}/{total}
            </span>
            <Badge variant={variant} size="sm">
              {percent}%
            </Badge>
          </div>
          <Progress value={percent} variant={variant} size="sm" />
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader title="Active Projects" />
        <CardContent>
          <span className="text-3xl font-bold text-white">{loading ? "—" : projectCount}</span>
          <p className="text-slate-400 text-sm mt-1">in progress</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader title="Today's Mood" />
        <CardContent>
          {moodMeta ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodMeta.emoji}</span>
              <Badge variant={moodMeta.variant} size="sm">
                {mood}
              </Badge>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Not set yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
