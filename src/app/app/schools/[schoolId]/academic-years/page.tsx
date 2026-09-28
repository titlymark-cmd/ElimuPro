import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAcademicYearAction } from "./actions";
import { AcademicYearForm } from "./AcademicYearForm";

export default async function AcademicYearsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const { data: years } = await supabaseAdmin()
    .from("academic_years")
    .select("id, name, start_date, end_date, is_current, terms(id, name, start_date, end_date, is_current)")
    .eq("school_id", schoolId)
    .order("start_date", { ascending: false });

  const boundAction = createAcademicYearAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Academic years</h2>
        {!years?.length ? (
          <p className="mt-3 text-sm text-white/50">No academic years yet — create the first one below.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {years.map((year) => (
              <div key={year.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold">{year.name}</h3>
                  {year.is_current && (
                    <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-0.5 text-xs font-semibold text-sky-300">
                      Current
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/50">
                  {year.start_date} – {year.end_date}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {year.terms
                    ?.slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((term) => (
                      <div key={term.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
                        <p className="text-xs font-medium text-white/70">
                          {term.name}
                          {term.is_current && <span className="ml-2 text-sky-300">•current</span>}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {term.start_date} – {term.end_date}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Create academic year</h2>
        <p className="mt-1 text-sm text-white/50">
          Creating a new academic year automatically creates its three terms and becomes the school&apos;s current year.
        </p>
        <div className="mt-4">
          <AcademicYearForm action={boundAction} />
        </div>
      </div>
    </div>
  );
}
