import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function SchoolOverviewPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  const { user, membership } = await requireSchoolMembership(schoolId);

  if (membership.role === "parent") {
    return <ParentOverview schoolId={schoolId} userId={user.id} />;
  }

  const admin = supabaseAdmin();
  const [{ data: currentYear }, { data: currentTerm }, { count: classCount }] = await Promise.all([
    admin.from("academic_years").select("name, start_date, end_date").eq("school_id", schoolId).eq("is_current", true).maybeSingle(),
    admin.from("terms").select("name, start_date, end_date").eq("school_id", schoolId).eq("is_current", true).maybeSingle(),
    admin.from("classes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Current academic year</p>
        <p className="mt-2 text-lg font-semibold">{currentYear?.name ?? "Not set"}</p>
        {currentYear && (
          <p className="mt-1 text-xs text-white/50">
            {currentYear.start_date} – {currentYear.end_date}
          </p>
        )}
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Current term</p>
        <p className="mt-2 text-lg font-semibold">{currentTerm?.name ?? "Not set"}</p>
        {currentTerm && (
          <p className="mt-1 text-xs text-white/50">
            {currentTerm.start_date} – {currentTerm.end_date}
          </p>
        )}
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Classes</p>
        <p className="mt-2 text-lg font-semibold">{classCount ?? 0}</p>
      </div>
    </div>
  );
}

async function ParentOverview({ schoolId, userId }: { schoolId: string; userId: string }) {
  const { data: children } = await supabaseAdmin()
    .from("learner_guardians")
    .select("relationship, learners!inner(id, admission_number, first_name, last_name, school_id, classes(name))")
    .eq("user_id", userId);

  const myChildren = (children ?? []).filter((c) => {
    const learner = Array.isArray(c.learners) ? c.learners[0] : c.learners;
    return learner?.school_id === schoolId;
  });

  if (!myChildren.length) {
    return <p className="text-sm text-white/50">No children linked to your account at this school yet.</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-semibold">Your children</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {myChildren.map((c) => {
          const learner = Array.isArray(c.learners) ? c.learners[0] : c.learners;
          if (!learner) return null;
          const cls = Array.isArray(learner.classes) ? learner.classes[0] : learner.classes;
          return (
            <Link
              key={learner.id}
              href={`/app/schools/${schoolId}/portal/children/${learner.id}`}
              className="tech-card block border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm transition hover:border-sky-400/50 hover:bg-white/[0.06]"
            >
              <h3 className="text-base font-semibold text-white">
                {learner.first_name} {learner.last_name}
              </h3>
              <p className="mt-1 text-xs text-white/50">
                Adm. No. {learner.admission_number} · {cls?.name ?? "No class"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
