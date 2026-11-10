"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Confetti, type ConfettiRef } from "@kwyw/kayv-glass-ui";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FieldLabel } from "@/components/ui/label";
import { RoomScene } from "@/components/game/room-scene";
import { ProgressPanel } from "@/components/game/progress-panel";
import { useScene } from "@/hooks/use-scene";
import { useGame } from "@/hooks/use-game";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { checkIsAdmin } from "@/lib/api/admin";
import { LATEST_MIGRATION } from "@/lib/db";
import { GAME_CATEGORIES, levelFromXp } from "@/lib/game";
import { onReward } from "@/lib/game-events";
import { reactionFor } from "@/lib/scene";

// The newest reward the room has already reacted to, so opening My World
// after checking a habit on Today plays that reward once, not on every visit.
const LAST_SEEN_KEY = "kayv:world-last-reward";

/**
 * My World: a small room and a character that grow with real habits, tasks,
 * and savings. The database awards the XP; this page shows it and lets the
 * sprout react.
 */
export default function WorldPage() {
  const { scene, burstKey, react } = useScene();
  const { progress, rewards, status } = useGame();
  const reducedMotion = useReducedMotion();
  const confetti = useRef<ConfettiRef>(null);
  const lastLevel = useRef<number | null>(null);
  // The preview row is an admin tool: see each reaction without waiting for
  // a real reward. Ordinary users never see buttons that fire pretend ones.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  function celebrateLevelUp() {
    react("celebrate");
    if (!reducedMotion) confetti.current?.fire();
  }

  // A reward earned while this page is open (another tab, or later a task
  // finished from here) plays at once.
  useEffect(() => {
    return onReward((reward) => {
      react(reactionFor(reward.category));
      window.localStorage.setItem(LAST_SEEN_KEY, reward.id);
    });
  }, [react]);

  // A reward earned before arriving here plays once on arrival; a level
  // reached since the last look gets the confetti.
  useEffect(() => {
    if (status !== "ready") return;
    const newest = rewards[0];
    const lastSeen = window.localStorage.getItem(LAST_SEEN_KEY);
    if (newest && newest.id !== lastSeen) {
      react(reactionFor(newest.category));
      window.localStorage.setItem(LAST_SEEN_KEY, newest.id);
    }
    const level = levelFromXp(progress.total_xp).level;
    if (lastLevel.current !== null && level > lastLevel.current) celebrateLevelUp();
    lastLevel.current = level;
    // celebrateLevelUp reads refs and stable hook values only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, rewards, progress.total_xp, react]);

  const connected = status === "ready";

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
                <Button type="button" variant="secondary" size="sm" onClick={celebrateLevelUp}>
                  🎉 Level up
                </Button>
              </div>
            </div>
          )}

          {status === "schema" && (
            <Alert variant="warning" title="The database needs updating">
              Run {LATEST_MIGRATION} from supabase/migrations in the Supabase SQL editor, then
              reload. Until then the room is here but nothing feeds it.
            </Alert>
          )}
          {status === "error" && (
            <Alert variant="danger">Couldn&apos;t load your progress. Try again in a moment.</Alert>
          )}
          {connected && progress.total_xp === 0 && (
            <Alert variant="info">
              Your sprout is settling in. Finish a task or check a habit and watch what happens.
            </Alert>
          )}
        </div>
        <ProgressPanel
          progress={progress}
          rewards={rewards}
          loading={status === "loading"}
          connected={connected}
        />
      </div>

      <Confetti ref={confetti} />
    </PageContainer>
  );
}
