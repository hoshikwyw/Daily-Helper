"use client";

import { Badge, Card, CardContent, CardHeader } from "@kwyw/kayv-glass-ui";
import { ACHIEVEMENTS, earnedAchievements } from "@/lib/achievements";
import { levelFromXp, type GameProgress } from "@/lib/game";
import { ROOM_UNLOCKS, nextUnlock } from "@/lib/unlocks";
import { FieldLabel } from "@/components/ui/label";

type CollectionPanelProps = {
  progress: GameProgress;
  /** False while rewards are not wired to the database; the hints hide. */
  connected: boolean;
};

/**
 * What the level has added to the room and which achievements are earned.
 * Both are derived from progress, so this card has nothing to load.
 */
export function CollectionPanel({ progress, connected }: CollectionPanelProps) {
  const level = levelFromXp(progress.total_xp).level;
  const earned = new Set(earnedAchievements(progress));
  const next = nextUnlock(level);
  return (
    <Card variant="elevated">
      <CardHeader
        title="Collection"
        description={
          next ? `Next for the room: ${next.label.toLowerCase()} at level ${next.level}.` : "The room is full."
        }
      />
      <CardContent>
        <div className="space-y-5">
          <div>
            <FieldLabel>Your room</FieldLabel>
            <ul className="space-y-1.5">
              {ROOM_UNLOCKS.map((u) => {
                const open = u.level <= level;
                return (
                  <li
                    key={u.key}
                    className={`flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm ${open ? "" : "opacity-60"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200">{u.label}</p>
                      {connected && <p className="text-xs text-slate-400 truncate">{u.blurb}</p>}
                    </div>
                    <Badge size="sm" variant={open ? "success" : "default"}>
                      {open ? "Unlocked" : `Level ${u.level}`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <FieldLabel>Achievements</FieldLabel>
            <ul className="space-y-1.5">
              {ACHIEVEMENTS.map((a) => {
                const got = earned.has(a.id);
                return (
                  <li
                    key={a.id}
                    className={`flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm ${got ? "" : "opacity-60"}`}
                  >
                    <span role="img" aria-label={got ? "Earned" : "Not yet"} className="text-lg leading-none">
                      {got ? a.emoji : "🔒"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-200">{a.label}</p>
                      {connected && <p className="text-xs text-slate-400 truncate">{a.hint}</p>}
                    </div>
                    {got && (
                      <Badge size="sm" variant="success">
                        Earned
                      </Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
