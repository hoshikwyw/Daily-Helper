import { Card, CardHeader, CardContent, CardFooter, Button } from "@kwyw/kayv-glass-ui";
import { appendPrompt, type JournalDraft } from "@/lib/journal";
import { formatDayLabel, formatFullDayLabel } from "@/lib/date";
import { Skeleton } from "@/components/ui/skeleton";
import { TextArea } from "@/components/ui/text-area";
import { MoodPicker } from "@/components/ui/mood-picker";
import { WritingPrompts } from "./writing-prompts";
import { HighlightsField } from "./highlights-field";
import type { JournalEntry } from "@/lib/types";

type JournalEditorCardProps = {
  selectedDate: Date;
  isToday: boolean;
  /** The saved row for this date, or null when writing a new entry. */
  entry: JournalEntry | null;
  draft: JournalDraft;
  onChange: (patch: Partial<JournalDraft>) => void;
  /** True when the draft differs from what's stored. */
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  onSave: () => void;
  onDelete: () => void;
  className?: string;
};

export function JournalEditorCard({
  selectedDate,
  isToday,
  entry,
  draft,
  onChange,
  dirty,
  loading,
  saving,
  deleting,
  onSave,
  onDelete,
  className = "",
}: JournalEditorCardProps) {
  return (
    <Card variant="elevated" className={`lg:col-span-2 ${className}`}>
      <CardHeader
        title={
          isToday ? `Today — ${formatDayLabel(selectedDate)}` : formatFullDayLabel(selectedDate)
        }
        description={
          entry ? "You already wrote for this day — edit away." : "Nothing written yet for this day."
        }
      />
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-48" />
          </div>
        ) : (
          // Mood comes first: it's a single tap, so the page opens with
          // something easy to do rather than an empty box to fill.
          <div className="space-y-6">
            <MoodPicker value={draft.mood} onChange={(mood) => onChange({ mood })} />

            <div className="space-y-3">
              <WritingPrompts
                onPick={(prompt) => onChange({ content: appendPrompt(draft.content, prompt) })}
              />
              <TextArea
                label="Your entry"
                value={draft.content}
                onChange={(content) => onChange({ content })}
                placeholder="Anything at all — a sentence is enough."
                rows={10}
              />
            </div>

            <HighlightsField
              highlights={draft.highlights}
              onChange={(highlights) => onChange({ highlights })}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={onSave} disabled={!dirty || saving || loading}>
            {saving ? "Saving…" : entry ? "Save changes" : "Save entry"}
          </Button>
          {!loading && (
            <span className="text-xs text-slate-400">
              {dirty ? "Unsaved changes" : entry ? "All changes saved" : "Nothing to save yet"}
            </span>
          )}
        </div>
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
