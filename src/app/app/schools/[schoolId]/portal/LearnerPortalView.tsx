import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { gradeFor } from "@/lib/grading";

export async function LearnerPortalView({
  schoolId,
  learnerId,
  backHref,
  backLabel,
}: {
  schoolId: string;
  learnerId: string;
  backHref: string;
  backLabel: string;
}) {
  const admin = supabaseAdmin();

  const { data: learner } = await admin
    .from("learners")
    .select("id, admission_number, first_name, last_name, class_id, classes(name)")
    .eq("id", learnerId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!learner) {
    return <p className="text-sm text-white/50">Learner record not found.</p>;
  }

  const { data: currentTerm } = await admin
    .from("terms")
    .select("id, name, academic_years(name)")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  const [{ data: marksRows }, { data: bands }, { data: feeItems }, { data: payments }, { data: attendance }] = await Promise.all([
    currentTerm
      ? admin
          .from("marks")
          .select("score, assessments!inner(max_score, subject_id, term_id, subjects(name))")
          .eq("learner_id", learnerId)
          .eq("assessments.term_id", currentTerm.id)
      : Promise.resolve({ data: [] as never[] }),
    admin.from("grading_bands").select("label, min_percent, max_percent").eq("school_id", schoolId),
    currentTerm
      ? admin
          .from("fee_structure_items")
          .select("amount, class_id")
          .eq("school_id", schoolId)
          .eq("term_id", currentTerm.id)
          .or(`class_id.eq.${learner.class_id ?? "00000000-0000-0000-0000-000000000000"},class_id.is.null`)
      : Promise.resolve({ data: [] as { amount: number }[] }),
    admin.from("payments").select("amount").eq("school_id", schoolId).eq("learner_id", learnerId),
    currentTerm
      ? admin.from("attendance_records").select("status").eq("learner_id", learnerId)
      : Promise.resolve({ data: [] as { status: string }[] }),
  ]);

  const cls = Array.isArray(learner.classes) ? learner.classes[0] : learner.classes;
  const year = currentTerm ? (Array.isArray(currentTerm.academic_years) ? currentTerm.academic_years[0] : currentTerm.academic_years) : null;

  type MarkRow = { score: number; assessments: { max_score: number; subject_id: string; subjects: { name: string } | { name: string }[] | null } };
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
  const subjectRows = Array.from(bySubject.values()).map((s) => ({
    ...s,
    percent: s.totalMax > 0 ? (s.totalScore / s.totalMax) * 100 : 0,
  }));

  const totalCharges = (feeItems ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalCharges - totalPaid;

  const attendanceCounts = (attendance ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Link href={backHref} className="text-xs font-medium text-white/40 hover:text-white/60">
        ← {backLabel}
      </Link>
      <div>
        <h2 className="text-xl font-bold">
          {learner.first_name} {learner.last_name}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Adm. No. {learner.admission_number} · {cls?.name ?? "—"}
          {currentTerm ? ` · ${currentTerm.name} (${year?.name ?? "—"})` : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Fee balance</p>
          <p className={`mt-2 text-2xl font-bold ${balance > 0 ? "text-rose-300" : "text-emerald-300"}`}>
            KES {Math.abs(balance).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-white/50">{balance > 0 ? "Due" : "Paid up"}</p>
          {balance > 0 && (
            <button
              type="button"
              disabled
              title="M-Pesa payment isn't set up yet — ask the school office how to pay in the meantime."
              className="mt-3 w-full cursor-not-allowed rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-xs font-medium text-white/30"
            >
              Pay via M-Pesa — Coming Soon
            </button>
          )}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Attendance (present)</p>
          <p className="mt-2 text-2xl font-bold">{attendanceCounts.present ?? 0}</p>
          <p className="mt-1 text-xs text-white/50">
            {attendanceCounts.absent ?? 0} absent · {attendanceCounts.late ?? 0} late
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Subjects graded</p>
          <p className="mt-2 text-2xl font-bold">{subjectRows.length}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Report card ({currentTerm?.name ?? "current term"})</h3>
        {!subjectRows.length ? (
          <p className="mt-3 text-sm text-white/50">No marks recorded yet this term.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Subject</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">%</th>
                  <th className="px-6 py-3 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subjectRows.map((s) => (
                  <tr key={s.subjectName}>
                    <td className="px-6 py-4">{s.subjectName}</td>
                    <td className="px-6 py-4 text-white/60">
                      {s.totalScore} / {s.totalMax}
                    </td>
                    <td className="px-6 py-4 text-white/60">{s.percent.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
                        {gradeFor(s.percent, bands ?? [])}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
