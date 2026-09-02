import { Card, CardHeader, CardContent, Progress } from "@kwyw/kayv-glass-ui";
import { progressPercent, progressVariant } from "@/lib/progress";
import { formatDate } from "@/lib/date";
import { FieldLabel } from "@/components/ui/label";
import type { Project } from "@/lib/types";

type ProjectProgressCardProps = {
  project: Project;
  done: number;
  total: number;
};

export function ProjectProgressCard({ project, done, total }: ProjectProgressCardProps) {
  const percent = progressPercent(done, total);

  return (
    <Card variant="elevated">
      <CardHeader title="Progress" />
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tasks complete</span>
              <span className="text-slate-200 font-medium">{percent}%</span>
            </div>
            <Progress value={percent} variant={progressVariant(percent)} size="md" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <FieldLabel mb="0">Created</FieldLabel>
              <p className="text-slate-300">{formatDate(project.created_at)}</p>
            </div>
            <div>
              <FieldLabel mb="0">Updated</FieldLabel>
              <p className="text-slate-300">{formatDate(project.updated_at)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
