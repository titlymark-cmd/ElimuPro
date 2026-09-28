import type { Metadata } from "next";
import { requireUser, getSchoolMemberships } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard — ElimuPro",
};

const ROLE_LABELS: Record<string, string> = {
  school_owner: "School Owner",
  school_admin: "School Admin",
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  bursar: "Bursar",
  teacher: "Teacher",
  parent: "Parent",
  learner: "Learner",
};

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await getSchoolMemberships(user.id);

  const { data: schools } = await supabaseAdmin()
    .from("schools")
    .select("id, name, category, status")
    .in(
      "id",
      memberships.map((m) => m.schoolId)
    );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome, {user.fullName.split(" ")[0]}</h1>
      <p className="mt-2 text-sm text-white/60">Here&apos;s what you have access to.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {memberships.map((membership) => {
          const school = schools?.find((s) => s.id === membership.schoolId);
          return (
            <div
              key={`${membership.schoolId}-${membership.role}`}
              className="tech-card border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-sky-400/50 hover:bg-white/[0.06]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                {ROLE_LABELS[membership.role] ?? membership.role}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{school?.name ?? "—"}</h3>
              <p className="mt-1 text-xs capitalize text-white/50">{school?.status ?? "unknown"}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
