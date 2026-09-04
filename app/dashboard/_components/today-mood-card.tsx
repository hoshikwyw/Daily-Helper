import { Card, CardHeader, CardContent } from "@kwyw/kayv-glass-ui";
import { MoodPicker } from "@/components/ui/mood-picker";

type TodayMoodCardProps = {
  value: string;
  /** Saves immediately on pick — there is no separate confirm step. */
  onChange: (mood: string) => void;
};

export function TodayMoodCard({ value, onChange }: TodayMoodCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader title="How are you feeling today?" />
      <CardContent>
        {/* The card header already asks the question, so the picker's own
            label is suppressed. */}
        <MoodPicker value={value} onChange={onChange} label={null} />
      </CardContent>
    </Card>
  );
}
