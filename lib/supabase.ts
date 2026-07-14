import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

// Creates a fresh, fully-typed Supabase browser client. Prefer the shared
// `supabase` singleton below for normal data access; use this only when a flow
// genuinely needs its own instance (e.g. isolated auth listeners).
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Shared singleton used across the client-rendered dashboard. Typed with the
// `Database` schema, so `.from(...).select(...)` results are inferred — no casts.
export const supabase = createClient();
