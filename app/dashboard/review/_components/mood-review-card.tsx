import Link from "next/link";
import { Card, CardHeader, CardContent, Badge } from "@kwyw/kayv-glass-ui";
import { MOOD_META } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import type { MoodReview } from "@/lib/review";

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export function MoodReviewCard({ review }: { review: MoodReview }) {
  const top = review.mostCommon ? MOOD_META[review.mostCommon] : null;
  return (
    <Card variant="elevated">
      <CardHeader
        title="Mood"
        description={
          review.logged === 0
            ? "No moods logged this week."
            : `Logged on ${review.logged} of 7 days · tap a day to open it`
        }
      />
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-1.5">
            {review.days.map(({ date, mood }, i) => (
              <Link
                key={date}
                href={`/dashboard/journal?date=${date}`}
                aria-label={`${formatDate(date)}: ${mood ? MOOD_META[mood].label : "no mood"}`}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-colors ${
                  mood
                    ? "border-white/10 bg-white/5 hover:bg-white/10"
                    : "border-white/5 hover:bg-white/5"
                }`}
              >
                <span className="text-[11px] uppercase text-slate-500">{WEEKDAY_LETTERS[i]}</span>
                <span className={`text-xl leading-none ${mood ? "" : "text-slate-600"}`}>
                  {mood ? MOOD_META[mood].emoji : "·"}
                </span>
              </Link>
            ))}
          </div>

          {top && review.mostCommon && (
            <p className="text-sm text-slate-300 flex items-center gap-2">
              Mostly
              <Badge variant={top.variant} size="sm">
                {top.emoji} {top.label}
              </Badge>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
