import { Card, CardHeader, CardContent, Badge, Calendar } from "@kwyw/kayv-glass-ui";
import { MOOD_META } from "@/lib/constants";
import { entryPreview } from "@/lib/journal";
import { fromISODate } from "@/lib/date";
import { EmptyState } from "@/components/ui/empty-state";
import type { JournalEntry } from "@/lib/types";

type JournalSidebarProps = {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  recentEntries: JournalEntry[];
  className?: string;
};

/** Left rail: the date picker plus a jump-list of the latest entries. */
export function JournalSidebar({
  selectedDate,
  onDateChange,
  recentEntries,
  className = "",
}: JournalSidebarProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <Card variant="elevated">
        <CardHeader title="Write about another day" />
        <CardContent>
          <Calendar
            mode="single"
            value={selectedDate}
            onChange={(date: Date | null) => date && onDateChange(date)}
          />
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader title="Recent entries" />
        <CardContent>
          {recentEntries.length === 0 ? (
            <EmptyState padding="sm">No entries yet.</EmptyState>
          ) : (
            <div className="space-y-2">
              {recentEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => onDateChange(fromISODate(entry.date))}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <span className="text-slate-300 text-sm font-medium w-20 shrink-0">
                    {entry.date}
                  </span>
                  {entry.mood && (
                    <Badge variant={MOOD_META[entry.mood].variant} size="sm">
                      {entry.mood}
                    </Badge>
                  )}
                  <span className="text-slate-500 text-xs truncate flex-1">
                    {entryPreview(entry)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
