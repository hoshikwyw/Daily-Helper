import { Card, CardHeader, CardContent, CardFooter, Button } from "@kwyw/kayv-glass-ui";
import { TextArea } from "@/components/ui/text-area";

type ProjectNotesCardProps = {
  notes: string;
  onNotesChange: (notes: string) => void;
  /** Save is disabled until something actually differs from the saved row. */
  dirty: boolean;
  saving: boolean;
  deleting: boolean;
  onSave: () => void;
  onDelete: () => void;
};

export function ProjectNotesCard({
  notes,
  onNotesChange,
  dirty,
  saving,
  deleting,
  onSave,
  onDelete,
}: ProjectNotesCardProps) {
  return (
    <Card variant="elevated">
      <CardHeader title="Notes" description="Log updates, ideas, and progress for this project" />
      <CardContent>
        <TextArea
          value={notes}
          onChange={onNotesChange}
          rows={8}
          placeholder="Write project notes, a changelog, or a running log of updates…"
          resize="y"
        />
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          className="text-red-400 hover:text-red-300"
        >
          {deleting ? "Deleting…" : "Delete project"}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          isLoading={saving}
          disabled={!dirty || saving}
          className="ml-auto"
        >
          Save changes
        </Button>
      </CardFooter>
    </Card>
  );
}
