import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAssessmentAction } from "../actions";
import { AssessmentForm } from "./AssessmentForm";

export default async function AssessmentsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher", "teacher"]);

  const admin = supabaseAdmin();
  const [{ data: assessments }, { data: classes }, { data: subjects }, { data: classSubjects }, { data: terms }] = await Promise.all([
    admin
      .from("assessments")
      .select("id, name, max_score, classes(name), subjects(name), terms(name)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    admin.from("classes").select("id, name").eq("school_id", schoolId).order("level_order", { ascending: true }),
    admin.from("subjects").select("id, name").eq("school_id", schoolId).order("name", { ascending: true }),
    admin.from("class_subjects").select("class_id, subject_id").eq("school_id", schoolId),
    admin.from("terms").select("id, name, academic_years(name)").eq("school_id", schoolId).order("start_date", { ascending: false }),
  ]);

  const subjectOptions = (subjects ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    classIds: (classSubjects ?? []).filter((cs) => cs.subject_id === s.id).map((cs) => cs.class_id),
  }));
  const termOptions = (terms ?? []).map((t) => {
    const year = Array.isArray(t.academic_years) ? t.academic_years[0] : t.academic_years;
    return { id: t.id, label: `${t.name} (${year?.name ?? "—"})` };
  });

  const boundCreateAssessment = createAssessmentAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Assessments</h2>
        {!assessments?.length ? (
          <p className="mt-3 text-sm text-white/50">No assessments yet — create one below, then enter marks for it.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium">Subject</th>
                  <th className="px-6 py-3 font-medium">Term</th>
                  <th className="px-6 py-3 font-medium">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assessments.map((a) => {
                  const cls = Array.isArray(a.classes) ? a.classes[0] : a.classes;
                  const subject = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
                  const term = Array.isArray(a.terms) ? a.terms[0] : a.terms;
                  return (
                    <tr key={a.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <Link href={`/app/schools/${schoolId}/academics/assessments/${a.id}`} className="text-white hover:text-sky-300">
                          {a.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-white/60">{cls?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-white/60">{subject?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-white/60">{term?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-white/60">{Number(a.max_score)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Create assessment</h2>
        <div className="mt-4">
          <AssessmentForm action={boundCreateAssessment} classes={classes ?? []} subjects={subjectOptions} terms={termOptions} />
        </div>
      </div>
    </div>
  );
}
