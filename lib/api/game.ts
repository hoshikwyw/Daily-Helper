import { toast } from "@kwyw/kayv-glass-ui";
import { supabase } from "@/lib/supabase";
import { getUserId, isSchemaError, reportError, reportSchemaError } from "@/lib/db";
import { DEFAULT_WORLD_NAME, EMPTY_PROGRESS, GAME_CATEGORIES, cleanWorldName, type GameProgress } from "@/lib/game";
import { emitReward } from "@/lib/game-events";
import { DEFAULT_AVATAR, toAvatarId, type AvatarId } from "@/lib/scene";
import type { GameReward } from "@/lib/types";

// Reads for My World, plus the one write a person can make: who lives in
// their world and what it is called. There are no writes to rewards here on
// purpose: the database awards XP through triggers, and the browser only
// asks what it got.

// Set once a read shows a game migration is missing, so the follow-up query
// after every habit check is skipped instead of failing quietly each time.
let schemaMissing = false;

export type ProgressResult =
  | { ok: true; progress: GameProgress }
  | { ok: false; reason: "schema" | "error" };

/** This user's totals. A person with no rewards yet has no row; that is zero. */
export async function getProgress(): Promise<ProgressResult> {
  const user_id = await getUserId();
  if (!user_id) return { ok: false, reason: "error" };
  const { data, error } = await supabase
    .from("game_progress")
    .select("total_xp, learning_xp, fitness_xp, savings_xp, general_xp")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) {
    if (isSchemaError(error)) {
      schemaMissing = true;
      return { ok: false, reason: "schema" };
    }
    reportError(error);
    return { ok: false, reason: "error" };
  }
  schemaMissing = false;
  return { ok: true, progress: data ?? EMPTY_PROGRESS };
}

/** What a person chose: a starter avatar and a name for the world. */
export type GameProfile = {
  avatar_id: AvatarId;
  world_name: string;
};

export const DEFAULT_PROFILE: GameProfile = { avatar_id: DEFAULT_AVATAR, world_name: DEFAULT_WORLD_NAME };

export type ProfileResult =
  | { ok: true; profile: GameProfile }
  | { ok: false; reason: "schema" | "error" };

/**
 * This user's choices, or the defaults before they have made any. Leaves
 * `schemaMissing` alone: that flag is about rewards, which keep working
 * without this table.
 */
export async function getProfile(): Promise<ProfileResult> {
  const user_id = await getUserId();
  if (!user_id) return { ok: false, reason: "error" };
  const { data, error } = await supabase
    .from("game_profiles")
    .select("avatar_id, world_name")
    .eq("user_id", user_id)
    .maybeSingle();
  if (error) {
    if (isSchemaError(error)) return { ok: false, reason: "schema" };
    reportError(error);
    return { ok: false, reason: "error" };
  }
  if (!data) return { ok: true, profile: DEFAULT_PROFILE };
  return { ok: true, profile: { avatar_id: toAvatarId(data.avatar_id), world_name: data.world_name } };
}

/** Saves both choices; the row is made on first save. Null on failure, with a toast. */
export async function saveProfile(profile: GameProfile): Promise<GameProfile | null> {
  const user_id = await getUserId();
  if (!user_id) {
    toast({ title: "Not signed in", description: "Sign in again to save your world.", variant: "danger" });
    return null;
  }
  const world_name = cleanWorldName(profile.world_name);
  const { data, error } = await supabase
    .from("game_profiles")
    .upsert({ user_id, avatar_id: profile.avatar_id, world_name }, { onConflict: "user_id" })
    .select("avatar_id, world_name")
    .single();
  if (reportSchemaError(error)) return null;
  if (!data) return null;
  return { avatar_id: toAvatarId(data.avatar_id), world_name: data.world_name };
}

/** The newest rewards, for the history list. Quiet on a missing migration. */
export async function listRecentRewards(limit = 8): Promise<GameReward[]> {
  const { data, error } = await supabase
    .from("game_rewards")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (isSchemaError(error)) schemaMissing = true;
    else reportError(error);
    return [];
  }
  return data ?? [];
}

/** The key the habit-check trigger writes; must match 007_game.sql. */
export function habitCheckKey(habitId: string, date: string): string {
  return `${habitId}:${date}`;
}

/**
 * After a completion is saved, asks whether the database awarded it and, if
 * so, says so and tells the rest of the app. `savedAt` is the saved row's own
 * server timestamp: a reward at or after it is this completion's; an older one
 * belongs to an earlier check of the same day (unchecked and re-checked), which
 * the trigger rightly did not pay twice. Quiet when there is nothing to say,
 * including before the migration is applied.
 */
export async function announceReward(
  sourceType: GameReward["source_type"],
  sourceKey: string,
  savedAt: string
): Promise<GameReward | null> {
  if (schemaMissing) return null;
  const { data, error } = await supabase
    .from("game_rewards")
    .select("*")
    .eq("source_type", sourceType)
    .eq("source_key", sourceKey)
    .maybeSingle();
  if (error) {
    if (isSchemaError(error)) schemaMissing = true;
    return null;
  }
  if (!data || new Date(data.created_at).getTime() < new Date(savedAt).getTime()) return null;
  const category = GAME_CATEGORIES.find((c) => c.value === data.category);
  toast({
    title: `+${data.xp} XP`,
    description: [category?.label, data.note].filter(Boolean).join(" · "),
    variant: "success",
  });
  emitReward(data);
  return data;
}
