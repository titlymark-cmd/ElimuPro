import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  status: "active" | "suspended";
}

/**
 * Centralized session verification (Data Access Layer, per Next.js's
 * own authentication guide). Memoized per request with React's cache()
 * so repeated calls during one render don't repeat the DB round trip.
 * Returns null rather than redirecting — callers that require a user
 * (page components) redirect themselves via requireUser().
 */
export const verifySession = cache(async (): Promise<SessionUser | null> => {
  const session = await readSession();
  if (!session) return null;

  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("id, email, full_name, status")
    .eq("id", session.userId)
    .maybeSingle();

  if (error || !data || data.status !== "active") return null;

  return { id: data.id, email: data.email, fullName: data.full_name, status: data.status };
});

/** For Server Components/Actions that must have a logged-in user. */
export async function requireUser(): Promise<SessionUser> {
  const user = await verifySession();
  if (!user) redirect("/login");
  return user;
}

export interface SchoolMembership {
  schoolId: string;
  role:
    | "school_owner"
    | "school_admin"
    | "headteacher"
    | "deputy_headteacher"
    | "bursar"
    | "teacher"
    | "parent"
    | "learner";
}

/**
 * The one place that decides whether the current user may act on a
 * given school. `schoolId` here must always come from something the
 * server itself resolved (a route param checked against this function,
 * never trusted on its own) — this function is what actually verifies
 * it, by reading the caller's own membership row rather than trusting
 * any school id the client claims.
 */
export const getSchoolMemberships = cache(async (userId: string): Promise<SchoolMembership[]> => {
  const { data, error } = await supabaseAdmin()
    .from("school_memberships")
    .select("school_id, role")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !data) return [];
  return data.map((row) => ({ schoolId: row.school_id, role: row.role as SchoolMembership["role"] }));
});

/**
 * Verifies the current user has one of `allowedRoles` at `schoolId`.
 * Redirects to /login if unauthenticated, throws (surfaces as an error
 * boundary) if authenticated but not authorized for that school/role —
 * this is the only supported way any route or Server Action should
 * decide "is this user allowed to touch this school's data."
 */
export async function requireSchoolMembership(
  schoolId: string,
  allowedRoles?: SchoolMembership["role"][]
): Promise<{ user: SessionUser; membership: SchoolMembership }> {
  const user = await requireUser();
  const memberships = await getSchoolMemberships(user.id);
  const membership = memberships.find((m) => m.schoolId === schoolId);

  if (!membership) {
    throw new Error("You do not have access to this school.");
  }
  if (allowedRoles && !allowedRoles.includes(membership.role)) {
    throw new Error("Your role does not permit this action.");
  }

  return { user, membership };
}
