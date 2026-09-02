import Link from "next/link";
import { Badge, Button } from "@kwyw/kayv-glass-ui";
import { PROJECT_STATUS_VARIANTS } from "@/lib/constants";
import type { Project } from "@/lib/types";

type ProjectHeaderProps = {
  project: Project;
  /** Live draft color, so the dot updates as the user picks a new one. */
  color: string;
  done: number;
  total: number;
};

export function ProjectHeader({ project, color, done, total }: ProjectHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <span
          className="w-5 h-5 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: color }}
        />
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={PROJECT_STATUS_VARIANTS[project.status]} size="sm">
              {project.status}
            </Badge>
            <span className="text-slate-500 text-sm">
              {done}/{total} tasks done
            </span>
          </div>
        </div>
      </div>
      <Link href="/dashboard/projects">
        <Button variant="ghost" size="sm">
          ← All projects
        </Button>
      </Link>
    </div>
  );
}
