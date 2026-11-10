"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Confetti, toast, type ConfettiRef } from "@kwyw/kayv-glass-ui";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { FieldLabel } from "@/components/ui/label";
import { RoomScene } from "@/components/game/room-scene";
import { ProgressPanel } from "@/components/game/progress-panel";
import { CollectionPanel } from "@/components/game/collection-panel";
import { CustomiseModal } from "@/components/game/customise-modal";
import { useScene } from "@/hooks/use-scene";
import { useGame } from "@/hooks/use-game";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { checkIsAdmin } from "@/lib/api/admin";
import { saveProfile, type GameProfile } from "@/lib/api/game";
import { earnedAchievements, newlyEarned } from "@/lib/achievements";
import { LATEST_MIGRATION } from "@/lib/db";
import { GAME_CATEGORIES, levelFromXp } from "@/lib/game";
import { onReward } from "@/lib/game-events";
import { avatarLabel, reactionFor } from "@/lib/scene";
import { describeUnlocks, unlockedAt, unlocksBetween } from "@/lib/unlocks";

// What this page has already announced, per person, so a shared device does
// not replay one person's rewards for the next.
//
// The newest reward the room has reacted to: opening My World after checking
// a habit on Today plays that reward once, not on every visit.
const lastSeenKey = (userId: string) => `kayv:world-last-reward:${userId}`;
// Before per-person keys there was one shared key; its value is adopted once.
const OLD_LAST_SEEN_KEY = "kayv:world-last-reward";
// Achievement ids already announced. Absent on the first visit, when whatever
// is already earned is recorded quietly rather than toasted all at once.
const seenAchievementsKey = (userId: string) => `kayv:world-achievements-seen:${userId}`;

/** The newest reward already reacted to, adopting the pre-per-person value once. */
function readLastSeen(key: string): string | null {
  const own = window.localStorage.getItem(key);
  if (own !== null) return own;
  const old = window.localStorage.getItem(OLD_LAST_SEEN_KEY);
  if (old !== null) {
    window.localStorage.setItem(key, old);
    window.localStorage.removeItem(OLD_LAST_SEEN_KEY);
  }
  return old;
}

/** The announced list, or null when there is none worth trusting. */
function readSeenAchievements(key: string): string[] | null {
  const raw = window.localStorage.getItem(key);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : null;
  } catch {
    return null;
  }
}

/**
 * My World: a small room and a character that grow with real habits, tasks,
 * and savings. The database awards the XP; this page shows it and lets the
 * avatar react.
 */
export default function WorldPage() {
  const { userId, progress, profile, profileStatus, rewards, status, setProfile } = useGame();
  const level = levelFromXp(progress.total_xp).level;
  const { scene, burstKey, react } = useScene({ avatar: profile.avatar_id, unlocked: unlockedAt(level) });
  const reducedMotion = useReducedMotion();
  const confetti = useRef<ConfettiRef>(null);
  const lastLevel = useRef<number | null>(null);
  const [customising, setCustomising] = useState(false);
  // Counts openings: the dialog is keyed by it so each opening starts from
  // the saved profile, while the element stays mounted to animate closed.
  const [customiseSession, setCustomiseSession] = useState(0);
  // The preview row is an admin tool: see each reaction without waiting for
  // a real reward. Ordinary users never see buttons that fire pretend ones.
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    checkIsAdmin().then(setIsAdmin);
  }, []);

  function celebrate() {
    react("celebrate");
    if (!reducedMotion) confetti.current?.fire();
  }

  function celebrateLevelUp(from: number, to: number) {
    celebrate();
    const gained = unlocksBetween(from, to);
    toast({
      title: `Level ${to}!`,
      description: gained.length ? `Unlocked: ${describeUnlocks(gained)}. Have a look around.` : "Keep going.",
      variant: "success",
    });
  }

  async function handleSave(next: GameProfile): Promise<boolean> {
    const saved = await saveProfile(next);
    if (!saved) return false;
    setProfile(saved);
    toast({ title: "Saved", description: `${saved.world_name} it is.`, variant: "success" });
    return true;
  }

  // A reward earned while this page is open (another tab, or a task finished
  // from here) plays at once.
  useEffect(() => {
    if (!userId) return;
    return onReward((reward) => {
      react(reactionFor(reward.category));
      window.localStorage.setItem(lastSeenKey(userId), reward.id);
    });
  }, [react, userId]);

  // A reward earned before arriving here plays once on arrival; a level
  // reached since the last look gets the confetti. `rewards` and `progress`
  // keep their identity across a re-read that changed nothing.
  useEffect(() => {
    if (status !== "ready" || !userId) return;
    const newest = rewards[0];
    const key = lastSeenKey(userId);
    if (newest && newest.id !== readLastSeen(key)) {
      react(reactionFor(newest.category));
      window.localStorage.setItem(key, newest.id);
    }
    if (lastLevel.current !== null && level > lastLevel.current) celebrateLevelUp(lastLevel.current, level);
    lastLevel.current = level;
    // celebrateLevelUp reads refs and stable hook values only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, rewards, level, userId, react]);

  // An achievement earned since the last visit gets a toast. The room is
  // already reacting to the reward that earned it, so no second reaction.
  useEffect(() => {
    if (status !== "ready" || !userId) return;
    const key = seenAchievementsKey(userId);
    const earned = earnedAchievements(progress);
    const seen = readSeenAchievements(key);
    if (seen !== null) {
      for (const a of newlyEarned(earned, seen)) {
        toast({ title: `${a.emoji} ${a.label}`, description: "Achievement earned.", variant: "success" });
      }
    }
    window.localStorage.setItem(key, JSON.stringify(earned));
  }, [status, progress, userId]);

  const connected = status === "ready";
  const canCustomise = connected && profileStatus === "ready";

  return (
    <PageContainer>
      <PageHeader
        breadcrumb={[{ label: "Today", href: "/dashboard" }, { label: "My World" }]}
        title={profile.world_name}
        subtitle="A cozy corner that grows with what you actually do."
        actions={
          canCustomise ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCustomiseSession((n) => n + 1);
                setCustomising(true);
              }}
            >
              Customise
            </Button>
          ) : undefined
        }
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
                <Button type="button" variant="secondary" size="sm" onClick={celebrate}>
                  🎉 Level up
                </Button>
              </div>
            </div>
          )}

          {status === "schema" && (
            <Alert variant="warning" title="The database needs updating">
              Run the files in supabase/migrations up to {LATEST_MIGRATION} in the Supabase SQL editor,
              then reload. Until then the room is here but nothing feeds it.
            </Alert>
          )}
          {connected && profileStatus === "schema" && (
            <Alert variant="warning" title="Customising needs one more migration">
              Run supabase/migrations/{LATEST_MIGRATION} in the Supabase SQL editor, then reload, to
              choose an avatar and name your world. Your XP is unaffected.
            </Alert>
          )}
          {status === "error" && (
            <Alert variant="danger">Couldn&apos;t load your progress. Try again in a moment.</Alert>
          )}
          {connected && progress.total_xp === 0 && (
            <Alert variant="info">
              Your {avatarLabel(scene.avatar).toLowerCase()} is settling in. Finish a task or check a
              habit and watch what happens.
            </Alert>
          )}
        </div>
        <div className="space-y-6">
          <ProgressPanel
            progress={progress}
            rewards={rewards}
            loading={status === "loading"}
            connected={connected}
          />
          <CollectionPanel progress={progress} connected={connected} />
        </div>
      </div>

      <CustomiseModal
        key={customiseSession}
        open={customising}
        onClose={() => setCustomising(false)}
        profile={profile}
        onSave={handleSave}
      />
      <Confetti ref={confetti} />
    </PageContainer>
  );
}
