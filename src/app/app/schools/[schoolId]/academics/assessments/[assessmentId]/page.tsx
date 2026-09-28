import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveMarkAction } from "../../actions";
import { MarksGrid } from "./MarksGrid";

export default async function AssessmentMarksPage({ params }: { params: Promise<{ schoolId: string; assessmentId: string }> }) {
  const { schoolId, assessmentId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher", "teacher"]);

  const admin = supabaseAdmin();
  const { data: assessment } = await admin
    .from("assessments")
    .select("id, name, max_score, class_id, classes(name), subjects(name), terms(name)")
    .eq("id", assessmentId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!assessment) notFound();

  const [{ data: learners }, { data: marks }] = await Promise.all([
    admin
      .from("learners")
      .select("id, admission_number, first_name, last_name")
      .eq("school_id", schoolId)
      .eq("class_id", assessment.class_id)
      .eq("status", "active")
      .order("admission_number", { ascending: true }),
    admin.from("marks").select("learner_id, score").eq("assessment_id", assessmentId),
  ]);

  const scoreByLearner = new Map((marks ?? []).map((m) => [m.learner_id, Number(m.score)]));
  const rows = (learners ?? []).map((l) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name}`,
    admissionNumber: l.admission_number,
    score: scoreByLearner.get(l.id) ?? null,
  }));

  const cls = Array.isArray(assessment.classes) ? assessment.classes[0] : assessment.classes;
  const subject = Array.isArray(assessment.subjects) ? assessment.subjects[0] : assessment.subjects;
  const term = Array.isArray(assessment.terms) ? assessment.terms[0] : assessment.terms;
  const boundSaveMark = saveMarkAction.bind(null, schoolId, assessmentId);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/app/schools/${schoolId}/academics/assessments`} className="text-xs font-medium text-white/40 hover:text-white/60">
          ← All assessments
        </Link>
        <h2 className="mt-2 text-xl font-semibold">{assessment.name}</h2>
        <p className="mt-1 text-sm text-white/50">
          {cls?.name ?? "—"} · {subject?.name ?? "—"} · {term?.name ?? "—"} · out of {Number(assessment.max_score)}
        </p>
      </div>

      {!rows.length ? (
        <p className="text-sm text-white/50">No active learners in this class yet.</p>
      ) : (
        <MarksGrid learners={rows} maxScore={Number(assessment.max_score)} action={boundSaveMark} />
      )}
    </div>
  );
}
