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
