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
    <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4 border-b border-white/8 pb-4 sm:pb-5">
      <div className="flex items-start gap-3 min-w-0">
        <span
          className="w-5 h-5 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white break-words">
            {project.name}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={PROJECT_STATUS_VARIANTS[project.status]} size="sm">
              {project.status}
            </Badge>
            <span className="text-slate-400 text-sm">
              {done}/{total} tasks done
            </span>
          </div>
        </div>
      </div>
      <Link href="/dashboard/projects" className="shrink-0">
        <Button variant="ghost" size="sm">
          ← All projects
        </Button>
      </Link>
    </header>
  );
}
