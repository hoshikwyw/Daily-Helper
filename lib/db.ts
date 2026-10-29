import { toast } from "@kwyw/kayv-glass-ui";
import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Small data-access helpers shared by the dashboard pages. They remove the
// `getUser()` + `if (error) toast(...)` boilerplate that was repeated in every
// create/update/delete handler.

/** Resolves the signed-in user's id, or `null` when signed out. */
export async function getUserId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Shows a standard danger toast for a Supabase error and reports whether one
 * occurred. Usage: `if (reportError(error)) return;`
 */
export function reportError(error: PostgrestError | null, title = "Error"): boolean {
  if (!error) return false;
  toast({ title, description: error.message, variant: "danger" });
  return true;
}

// Codes that mean the database is behind the app, i.e. a migration in
// supabase/migrations has not been applied yet:
//
//   PGRST204  PostgREST's schema cache has no such column.
//   PGRST205  PostgREST's schema cache has no such table.
//   42703     Postgres: the column does not exist.
//   42P01     Postgres: the table does not exist.
//   23514     A CHECK rejected the row — an old constraint still in place.
const SCHEMA_ERROR_CODES = new Set(["PGRST204", "PGRST205", "42703", "42P01", "23514"]);

/** True when the error means a migration is pending rather than a bad request. */
export function isSchemaError(error: PostgrestError | null): boolean {
  return !!error && SCHEMA_ERROR_CODES.has(error.code);
}

/**
 * Like `reportError`, but a pending-migration error gets an actionable toast
 * naming the file to run instead of the raw PostgREST message.
 */
export function reportSchemaError(error: PostgrestError | null, migrationFile: string): boolean {
  if (!error) return false;
  if (!isSchemaError(error)) return reportError(error);
  toast({
    title: "Database needs updating",
    description: `Apply the files in supabase/migrations in order, up to ${migrationFile}, in the Supabase SQL editor, then reload the page. (${error.message})`,
    variant: "danger",
  });
  return true;
}
