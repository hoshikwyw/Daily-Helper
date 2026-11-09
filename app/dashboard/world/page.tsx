"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Confetti, type ConfettiRef } from "@kwyw/kayv-glass-ui";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FieldLabel } from "@/components/ui/label";
import { RoomScene } from "@/components/game/room-scene";
import { ProgressPanel } from "@/components/game/progress-panel";
import { useScene } from "@/hooks/use-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { checkIsAdmin } from "@/lib/api/admin";
import { EMPTY_PROGRESS, GAME_CATEGORIES } from "@/lib/game";
import { reactionFor } from "@/lib/scene";

/**
 * My World: a small room and a character that grow with real habits, tasks,
 * and savings. Progress connects to the database in a later part; until then
 * the panel shows the empty state and the reactions can be previewed by hand.
 */
export default function WorldPage() {
  const { scene, burstKey, react } = useScene();
  const reducedMotion = useReducedMotion();
  const confetti = useRef<ConfettiRef>(null);
  // The preview row is a tool for the admin while rewards are not wired;
  // ordinary users never see buttons that fire pretend rewards.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  function previewLevelUp() {
    react("celebrate");
    if (!reducedMotion) confetti.current?.fire();
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "My World" }]}
        title="My World"
        subtitle="A cozy corner that grows with what you actually do."
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
        <div className="space-y-4">
          <RoomScene state={scene} burstKey={burstKey} />

          {/* Until rewards are wired, this is how the admin sees each
              reaction. The same `react` call is what a real reward will make. */}
          {isAdmin && (
            <div>
              <FieldLabel>Preview reactions</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {GAME_CATEGORIES.map((c) => (
                  <Button
                    key={c.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => react(reactionFor(c.value))}
                  >
                    {c.emoji} {c.label}
                  </Button>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={previewLevelUp}>
                  🎉 Level up
                </Button>
              </div>
            </div>
          )}

          <Alert variant="info">
            Your sprout is settling in. In an upcoming update, finishing tasks, checking habits,
            and adding to savings will feed it for real.
          </Alert>
        </div>
        <ProgressPanel progress={EMPTY_PROGRESS} connected={false} />
      </div>

      <Confetti ref={confetti} />
    </PageContainer>
  );
}
