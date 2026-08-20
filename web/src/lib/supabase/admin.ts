import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client: bypasses RLS. Server-only — SUPABASE_SERVICE_ROLE_KEY
// must never be exposed to the browser (no NEXT_PUBLIC_ prefix). Used only by
// the collector cron job to write to public.opportunities.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
