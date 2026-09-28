import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. Every table in the
 * database has RLS enabled with zero policies (see supabase/migrations),
 * so this is deliberately the ONLY way any code in this app can reach
 * the database at all. Never import this file from a Client Component
 * or expose the key it uses to the browser; `server-only` makes an
 * accidental client-side import a build error rather than a leak.
 *
 * Tenant isolation is NOT enforced by the database here — it's enforced
 * by application code always deriving school_id from the caller's
 * verified session (see lib/auth/dal.ts), never from client input.
 */
function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Get it from the Supabase dashboard " +
        "(Project Settings -> API -> service_role) and add it to .env.local."
    );
  }
  return key;
}

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  }

  return createClient(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
