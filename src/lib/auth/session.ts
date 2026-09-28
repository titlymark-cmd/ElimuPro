import "server-only";
import { cookies, headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth/token";

const COOKIE_NAME = "elimupro_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function requestMeta() {
  const h = await headers();
  return {
    ipAddress: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: h.get("user-agent"),
  };
}

/**
 * Creates a DB-backed session row and sets the httpOnly cookie. The
 * cookie carries the raw random token; only its sha256 hash is stored,
 * so a database read alone can't be replayed as a live session. Being
 * DB-backed (rather than a stateless JWT) is what makes revocation and
 * "log out this device" / login history actually possible.
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const { ipAddress, userAgent } = await requestMeta();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  const { error } = await supabaseAdmin()
    .from("sessions")
    .insert({
      user_id: userId,
      token_hash: hashToken(token),
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt.toISOString(),
    });

  if (error) throw new Error(`Failed to create session: ${error.message}`);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export interface ActiveSession {
  userId: string;
  sessionId: string;
}

/**
 * Reads the session cookie, looks up the (unexpired, unrevoked) session,
 * and touches last_used_at. Returns null for any invalid/missing/expired
 * session — callers treat that as "not logged in", same as
 * MealVest's authFetch convention.
 */
export async function readSession(): Promise<ActiveSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("sessions")
    .select("id, user_id, expires_at, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (error || !data) return null;
  if (data.revoked_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  // Best-effort — failure to update the timestamp shouldn't fail auth.
  void admin.from("sessions").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { userId: data.user_id, sessionId: data.id };
}

/** Revokes the current session (logout) and clears the cookie. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await supabaseAdmin()
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hashToken(token));
  }

  cookieStore.delete(COOKIE_NAME);
}
