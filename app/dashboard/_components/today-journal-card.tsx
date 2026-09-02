import { Card, CardHeader, CardContent, Alert } from "@kwyw/kayv-glass-ui";
import type { JournalEntry } from "@/lib/types";

type TodayJournalCardProps = {
  /** Today's entry, or null when nothing is written yet. */
  entry: JournalEntry | null;
};

export function TodayJournalCard({ entry }: TodayJournalCardProps) {
  const written = !!entry?.content;

  return (
    <Card variant="elevated">
      <CardHeader title="Journal" description={written ? "Today's entry" : "No entry yet"} />
      <CardContent>
        {written ? (
          <p className="text-slate-300 text-sm line-clamp-4">{entry.content}</p>
        ) : (
          <Alert variant="info" title="Start your day's journal">
            Write about what you worked on, how you felt, or what you learned.
          </Alert>
        )}
        <a
          href="/dashboard/journal"
          className="inline-block mt-3 text-kv-400 text-sm hover:text-kv-300 transition-colors"
        >
          {written ? "Edit entry →" : "Open journal →"}
        </a>
      </CardContent>
    </Card>
  );
}
