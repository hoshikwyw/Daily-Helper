import Link from "next/link";
import { Card, CardContent, Button } from "@kwyw/kayv-glass-ui";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the loaded layout — header line, main column, right rail. */
export function ProjectDetailSkeleton() {
  return (
    <div className="relative space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

/** Shown for a missing `?id=`, or an id that no longer resolves to a row. */
export function ProjectNotFound() {
  return (
    <div className="relative max-w-4xl">
      <Card variant="elevated">
        <CardContent>
          <p className="text-slate-400 text-sm text-center py-10">
            This project doesn&apos;t exist or was deleted.
          </p>
          <div className="flex justify-center">
            <Link href="/dashboard/projects">
              <Button variant="primary" size="sm">
                ← Back to projects
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
