import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_EMAIL = 8;
const MAX_ATTEMPTS_PER_IP = 20;

/**
 * Brute-force protection, backed by the login_attempts audit trail
 * rather than in-memory state — correct across serverless invocations,
 * unlike a process-local counter. Checked BEFORE verifying a password,
 * so a locked-out caller never gets a password-verification timing
 * signal at all.
 */
export async function isLoginRateLimited(email: string, ipAddress: string | null): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const admin = supabaseAdmin();

  const { count: emailCount } = await admin
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("success", false)
    .ilike("email_attempted", email)
    .gte("created_at", since);

  if ((emailCount ?? 0) >= MAX_ATTEMPTS_PER_EMAIL) return true;

  if (ipAddress) {
    const { count: ipCount } = await admin
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("success", false)
      .eq("ip_address", ipAddress)
      .gte("created_at", since);

    if ((ipCount ?? 0) >= MAX_ATTEMPTS_PER_IP) return true;
  }

  return false;
}

export async function recordLoginAttempt(input: {
  userId: string | null;
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
}): Promise<void> {
  await supabaseAdmin().from("login_attempts").insert({
    user_id: input.userId,
    email_attempted: input.email,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
    success: input.success,
  });
}
