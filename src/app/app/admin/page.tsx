import type { Metadata } from "next";
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { updateSchoolStatusAction } from "./actions";
import { SchoolStatusSelect } from "./SchoolStatusSelect";

export const metadata: Metadata = {
  title: "Platform Admin — ElimuPro",
};

export default async function PlatformAdminPage() {
  await requirePlatformAdmin();

  const admin = supabaseAdmin();
  const { data: schools } = await admin
    .from("schools")
    .select("id, name, slug, category, status, subscription_status, created_at")
    .order("created_at", { ascending: false });

  const schoolsWithCounts = await Promise.all(
    (schools ?? []).map(async (school) => {
      const [{ count: memberCount }, { count: learnerCount }] = await Promise.all([
        admin.from("school_memberships").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        admin.from("learners").select("id", { count: "exact", head: true }).eq("school_id", school.id),
      ]);
      return { ...school, memberCount: memberCount ?? 0, learnerCount: learnerCount ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Admin</h1>
        <p className="mt-2 text-sm text-white/60">Cross-tenant oversight of every school on ElimuPro.</p>
      </div>

      {!schoolsWithCounts.length ? (
        <p className="text-sm text-white/50">No schools have signed up yet.</p>
      ) : (
        <div className="space-y-3">
          {schoolsWithCounts.map((school) => {
            const boundUpdateStatus = updateSchoolStatusAction.bind(null, school.id);
            return (
              <div
                key={school.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
              >
                <div>
                  <Link href={`/app/admin/${school.id}`} className="text-base font-semibold text-white hover:text-sky-300">
                    {school.name}
                  </Link>
                  <p className="mt-1 text-xs text-white/50">
                    /{school.slug} · {school.category} · {school.memberCount} staff/parents · {school.learnerCount} learners
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Subscription: {school.subscription_status} · Joined {new Date(school.created_at).toLocaleDateString()}
                  </p>
                </div>
                <SchoolStatusSelect current={school.status} action={boundUpdateStatus} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
