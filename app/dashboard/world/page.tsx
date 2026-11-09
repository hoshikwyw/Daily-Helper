"use client";

import { Alert } from "@kwyw/kayv-glass-ui";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { RoomScene } from "@/components/game/room-scene";
import { ProgressPanel } from "@/components/game/progress-panel";
import { restingScene } from "@/components/game/scene-state";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { EMPTY_PROGRESS } from "@/lib/game";

/**
 * My World: a small room and a character that grow with real habits, tasks,
 * and savings. This part is the shell; progress connects to the database in
 * a later part, so the numbers here are the empty state.
 */
export default function WorldPage() {
  const timeOfDay = useTimeOfDay();
  const scene = restingScene(timeOfDay);

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "My World" }]}
        title="My World"
        subtitle="A cozy corner that grows with what you actually do."
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
        <div className="space-y-4">
          <RoomScene state={scene} />
          <Alert variant="info">
            Your sprout is settling in. In an upcoming update, finishing tasks, checking habits,
            and adding to savings will feed it.
          </Alert>
        </div>
        <ProgressPanel progress={EMPTY_PROGRESS} connected={false} />
      </div>
    </PageContainer>
  );
}
