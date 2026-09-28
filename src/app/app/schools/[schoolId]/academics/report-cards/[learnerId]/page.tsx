import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { gradeFor } from "@/lib/grading";

export default async function ReportCardPage({ params }: { params: Promise<{ schoolId: string; learnerId: string }> }) {
  const { schoolId, learnerId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher", "teacher"]);

  const admin = supabaseAdmin();
  const { data: learner } = await admin
    .from("learners")
    .select("id, admission_number, first_name, last_name, class_id, classes(name)")
    .eq("id", learnerId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!learner) notFound();

  const { data: currentTerm } = await admin
    .from("terms")
    .select("id, name, academic_years(name)")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  const [{ data: marksRows }, { data: bands }] = await Promise.all([
    currentTerm
      ? admin
          .from("marks")
          .select("score, assessments!inner(name, max_score, subject_id, term_id, subjects(name))")
          .eq("learner_id", learnerId)
          .eq("assessments.term_id", currentTerm.id)
      : Promise.resolve({ data: [] as never[] }),
    admin.from("grading_bands").select("label, min_percent, max_percent").eq("school_id", schoolId),
  ]);

  const cls = Array.isArray(learner.classes) ? learner.classes[0] : learner.classes;
  const year = currentTerm ? (Array.isArray(currentTerm.academic_years) ? currentTerm.academic_years[0] : currentTerm.academic_years) : null;

  type MarkRow = { score: number; assessments: { name: string; max_score: number; subject_id: string; subjects: { name: string } | { name: string }[] | null } };
  const bySubject = new Map<string, { subjectName: string; totalScore: number; totalMax: number }>();

  for (const row of (marksRows ?? []) as unknown as MarkRow[]) {
    const a = Array.isArray(row.assessments) ? row.assessments[0] : row.assessments;
    if (!a) continue;
    const subject = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects;
    const subjectName = subject?.name ?? "Unknown";
    const existing = bySubject.get(a.subject_id) ?? { subjectName, totalScore: 0, totalMax: 0 };
    existing.totalScore += Number(row.score);
    existing.totalMax += Number(a.max_score);
    bySubject.set(a.subject_id, existing);
  }

  const subjectRows = Array.from(bySubject.values()).map((s) => {
    const percent = s.totalMax > 0 ? (s.totalScore / s.totalMax) * 100 : 0;
    return { ...s, percent, grade: gradeFor(percent, bands ?? []) };
  });

  const overallPercent = subjectRows.length
    ? subjectRows.reduce((sum, s) => sum + s.percent, 0) / subjectRows.length
    : 0;

  return (
    <div className="space-y-6">
      <Link href={`/app/schools/${schoolId}/academics/report-cards`} className="text-xs font-medium text-white/40 hover:text-white/60">
        ← All report cards
      </Link>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-xl font-bold">
              {learner.first_name} {learner.last_name}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Adm. No. {learner.admission_number} · {cls?.name ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-white/40">Term</p>
            <p className="text-sm text-white">{currentTerm ? `${currentTerm.name} (${year?.name ?? "—"})` : "No current term set"}</p>
          </div>
        </div>

        {!subjectRows.length ? (
          <p className="mt-6 text-sm text-white/50">No marks recorded for this learner this term yet.</p>
        ) : (
          <>
            <table className="mt-6 w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="py-2 font-medium">Subject</th>
                  <th className="py-2 font-medium">Score</th>
                  <th className="py-2 font-medium">%</th>
                  <th className="py-2 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subjectRows.map((s) => (
                  <tr key={s.subjectName}>
                    <td className="py-3">{s.subjectName}</td>
                    <td className="py-3 text-white/60">
                      {s.totalScore} / {s.totalMax}
                    </td>
                    <td className="py-3 text-white/60">{s.percent.toFixed(1)}%</td>
                    <td className="py-3">
                      <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs text-sky-300">{s.grade}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
              <span className="text-sm font-semibold text-white">Overall average</span>
              <span className="text-lg font-bold text-white">
                {overallPercent.toFixed(1)}% · {gradeFor(overallPercent, bands ?? [])}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
