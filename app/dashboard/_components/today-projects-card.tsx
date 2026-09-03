import { Card, CardHeader, CardContent, Badge } from "@kwyw/kayv-glass-ui";
import type { Project } from "@/lib/types";

/** How many tech-stack entries fit on the one-line summary. */
const VISIBLE_TECH = 3;

export function TodayProjectsCard({ projects }: { projects: Project[] }) {
  return (
    <Card variant="elevated" className="relative">
      <CardHeader title="Active Projects" description="Your current focus" />
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{project.name}</p>
                {project.tech_stack.length > 0 && (
                  <p className="text-xs text-slate-400 truncate">
                    {project.tech_stack.slice(0, VISIBLE_TECH).join(" · ")}
                  </p>
                )}
              </div>
              <Badge variant="primary" size="sm">
                active
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
