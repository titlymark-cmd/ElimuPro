import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function SchoolOverviewPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId);

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
