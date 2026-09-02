import { Card, CardHeader, CardContent, Select } from "@kwyw/kayv-glass-ui";
import { moodSelectOptions } from "@/lib/journal";

const OPTIONS = moodSelectOptions("Select your mood…");

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
        <Select value={value} onChange={onChange} options={OPTIONS} />
      </CardContent>
    </Card>
  );
}
