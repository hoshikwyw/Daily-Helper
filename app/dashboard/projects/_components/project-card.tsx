import Link from "next/link";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Badge,
  Progress,
  Button,
  Tooltip,
  ConfettiButton,
} from "@kwyw/kayv-glass-ui";
import { PROJECT_STATUS_VARIANTS } from "@/lib/constants";
import { progressPercent, progressVariant } from "@/lib/progress";
import type { TaskCount } from "@/lib/api/tasks";
import type { Project } from "@/lib/types";

/** How many tech-stack badges fit before the rest collapse into a tooltip. */
const VISIBLE_TECH = 3;

type ProjectCardProps = {
  project: Project;
  /** Task tally for this project, or undefined when it has no linked tasks. */
  taskCount?: TaskCount;
};

export function ProjectCard({ project, taskCount }: ProjectCardProps) {
  const percent = progressPercent(taskCount?.done ?? 0, taskCount?.total ?? 0);
  const overflowTech = project.tech_stack.slice(VISIBLE_TECH);

  return (
    <Card variant="elevated" className="flex flex-col">
      <CardHeader title={project.name} description={project.description ?? undefined} />
      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <Badge variant={PROJECT_STATUS_VARIANTS[project.status]} size="sm">
            {project.status}
          </Badge>
          {project.tech_stack.slice(0, VISIBLE_TECH).map((t) => (
            <Badge key={t} variant="default" size="sm">
              {t}
            </Badge>
          ))}
        </div>

        {taskCount && taskCount.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Tasks</span>
              <span>
                {taskCount.done}/{taskCount.total}
              </span>
            </div>
            <Progress value={percent} variant={progressVariant(percent)} size="sm" />
          </div>
        )}

        {overflowTech.length > 0 && (
          <Tooltip content={overflowTech.join(", ")}>
            <span className="text-xs text-slate-400 cursor-default">
              +{overflowTech.length} more
            </span>
          </Tooltip>
        )}
      </CardContent>
      <CardFooter>
        <Link href={`/dashboard/project?id=${project.id}`}>
          <Button variant="ghost" size="sm">
            View details →
          </Button>
        </Link>
        {project.status === "completed" && (
          <ConfettiButton
            preset="stars"
            className="ml-auto text-sm text-yellow-400 hover:text-yellow-300 transition-colors bg-transparent border-0"
          >
            🏆
          </ConfettiButton>
        )}
      </CardFooter>
    </Card>
  );
}
