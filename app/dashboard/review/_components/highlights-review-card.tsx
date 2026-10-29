import Link from "next/link";
import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { formatDate } from "@/lib/date";
import type { Highlight } from "@/lib/review";
import { EmptyState } from "@/components/ui/empty-state";

export function HighlightsReviewCard({ highlights }: { highlights: Highlight[] }) {
  return (
    <Card variant="elevated">
      <CardHeader title="Highlights" description="From your journal entries this week" />
      <CardContent>
        {highlights.length === 0 ? (
          <EmptyState padding="sm">No highlights written this week.</EmptyState>
        ) : (
          <ul className="space-y-2">
            {highlights.map((h, i) => (
              <li key={`${h.date}-${i}`} className="flex items-start gap-3 text-sm">
                <span className="text-amber-300 shrink-0 mt-0.5">★</span>
                <span className="text-slate-200 flex-1 min-w-0">{h.text}</span>
                <Link
                  href={`/dashboard/journal?date=${h.date}`}
                  className="text-xs text-slate-500 hover:text-kv-300 shrink-0 transition-colors"
                >
                  {formatDate(h.date)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
