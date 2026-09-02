import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Button,
  Select,
  Alert,
} from "@kwyw/kayv-glass-ui";
import { moodSelectOptions, type JournalDraft } from "@/lib/journal";
import { formatDayLabel, formatFullDayLabel } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { TextArea } from "@/components/ui/text-area";
import { HighlightsField } from "./highlights-field";
import type { JournalEntry } from "@/lib/types";

const MOOD_OPTIONS = moodSelectOptions("Select mood…");

type JournalEditorCardProps = {
  selectedDate: Date;
  isToday: boolean;
  /** The saved row for this date, or null when writing a new entry. */
  entry: JournalEntry | null;
  draft: JournalDraft;
  onChange: (patch: Partial<JournalDraft>) => void;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  onSave: () => void;
  onDelete: () => void;
};

export function JournalEditorCard({
  selectedDate,
  isToday,
  entry,
  draft,
  onChange,
  loading,
  saving,
  deleting,
  onSave,
  onDelete,
}: JournalEditorCardProps) {
  return (
    <Card variant="elevated" className="lg:col-span-2">
      <CardHeader
        title={
          isToday ? `Today — ${formatDayLabel(selectedDate)}` : formatFullDayLabel(selectedDate)
        }
        description={entry ? "Editing existing entry" : "New entry"}
      />
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          <div className="space-y-5">
            {isToday && !entry?.content && (
              <Alert variant="info" title="Start writing">
                What did you work on? What went well? What did you learn?
              </Alert>
            )}

            <Select
              label="Mood"
              value={draft.mood}
              onChange={(mood) => onChange({ mood })}
              options={MOOD_OPTIONS}
            />

            <TextArea
              label="Journal entry"
              value={draft.content}
              onChange={(content) => onChange({ content })}
              placeholder="Write your thoughts..."
              rows={10}
            />

            <HighlightsField
              highlights={draft.highlights}
              onChange={(highlights) => onChange({ highlights })}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="primary" onClick={onSave} disabled={saving || loading}>
          {saving ? "Saving…" : entry ? "Update Entry" : "Save Entry"}
        </Button>
        {entry && (
          <Button
            variant="ghost"
            onClick={onDelete}
            disabled={deleting || loading}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
