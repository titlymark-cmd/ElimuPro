import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { updateSchoolStatusAction } from "../actions";
import { SchoolStatusSelect } from "../SchoolStatusSelect";

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

export default async function PlatformAdminSchoolDetailPage({ params }: { params: Promise<{ schoolId: string }> }) {
  await requirePlatformAdmin();
  const { schoolId } = await params;

  const admin = supabaseAdmin();
  const [{ data: school }, { data: memberships }, { count: learnerCount }] = await Promise.all([
    admin
      .from("schools")
      .select("id, name, slug, category, county, subcounty, phone, email, status, subscription_plan, subscription_status, created_at")
      .eq("id", schoolId)
      .maybeSingle(),
    admin.from("school_memberships").select("role, status, users(full_name, email)").eq("school_id", schoolId),
    admin.from("learners").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
  ]);

  if (!school) notFound();

  const roleCounts = (memberships ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});

  const boundUpdateStatus = updateSchoolStatusAction.bind(null, school.id);

  return (
    <div className="space-y-10">
      <div>
        <Link href="/app/admin" className="text-xs font-medium text-white/40 hover:text-white/60">
          ← All schools
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{school.name}</h2>
            <p className="mt-1 text-sm text-white/50">
              /{school.slug} · {school.category}
              {school.county ? ` · ${school.county}` : ""}
            </p>
          </div>
          <SchoolStatusSelect current={school.status} action={boundUpdateStatus} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">Learners</p>
          <p className="mt-2 text-2xl font-semibold">{learnerCount ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">Subscription</p>
          <p className="mt-2 text-sm text-white/80">
            {school.subscription_plan ?? "No plan"} · <span className="capitalize">{school.subscription_status}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">Contact</p>
          <p className="mt-2 text-sm text-white/80">{school.email ?? school.phone ?? "Not provided"}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Members</h3>
        {!memberships?.length ? (
          <p className="mt-3 text-sm text-white/50">No members yet.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(roleCounts).map(([role, count]) => (
                <span key={role} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  {ROLE_LABELS[role] ?? role}: {count}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {memberships.map((m, i) => {
                const user = Array.isArray(m.users) ? m.users[0] : m.users;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3"
                  >
                    <div>
                      <p className="text-sm text-white/80">{user?.full_name ?? "—"}</p>
                      <p className="text-xs text-white/40">{user?.email}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/60">
                      {ROLE_LABELS[m.role] ?? m.role}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
