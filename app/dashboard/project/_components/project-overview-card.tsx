import { Card, CardHeader, CardContent, Badge, Input, Select } from "@kwyw/kayv-glass-ui";
import { PROJECT_COLORS, PROJECT_STATUS_OPTIONS } from "@/lib/constants";
import { parseTechStack, type ProjectDraft } from "@/lib/projects";
import { ColorPicker } from "@/components/ui/color-picker";
import { FieldLabel } from "@/components/ui/label";
import type { ProjectStatus } from "@/lib/types";

type ProjectOverviewCardProps = {
  draft: ProjectDraft;
  onChange: (patch: Partial<ProjectDraft>) => void;
  /** The repository URL as last SAVED — the "open link" shortcut follows it. */
  savedRepositoryUrl: string | null;
};

export function ProjectOverviewCard({
  draft,
  onChange,
  savedRepositoryUrl,
}: ProjectOverviewCardProps) {
  const tech = parseTechStack(draft.techStack);

  return (
    <Card variant="elevated">
      <CardHeader title="Overview" description="Project details and settings" />
      <CardContent>
        <div className="space-y-5">
          <Input
            label="Name"
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Project name"
          />

          <Input
            label="Description"
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What is this project about?"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel mb="1.5">Status</FieldLabel>
              <Select
                value={draft.status}
                onChange={(value) => onChange({ status: value as ProjectStatus })}
                options={PROJECT_STATUS_OPTIONS}
              />
            </div>
            <div>
              <Input
                label="Repository URL"
                type="url"
                value={draft.repository}
                onChange={(e) => onChange({ repository: e.target.value })}
                placeholder="https://github.com/..."
              />
              {savedRepositoryUrl && (
                <a
                  href={savedRepositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1.5 text-kv-400 text-xs hover:text-kv-300 break-all"
                >
                  Open saved link ↗
                </a>
              )}
            </div>
          </div>

          <div>
            <Input
              label="Tech stack (comma-separated)"
              value={draft.techStack}
              onChange={(e) => onChange({ techStack: e.target.value })}
              placeholder="React, TypeScript, Supabase"
            />
            {tech.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tech.map((t) => (
                  <Badge key={t} variant="default" size="sm">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <ColorPicker
            label="Color"
            colors={PROJECT_COLORS}
            value={draft.color}
            onChange={(color) => onChange({ color })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
