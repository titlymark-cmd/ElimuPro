import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSubjectAction, toggleClassSubjectAction } from "../actions";
import { SubjectForm } from "./SubjectForm";
import { ClassSubjectToggle } from "./ClassSubjectToggle";

export default async function SubjectsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const admin = supabaseAdmin();
  const [{ data: subjects }, { data: classes }, { data: links }] = await Promise.all([
    admin.from("subjects").select("id, name").eq("school_id", schoolId).order("name", { ascending: true }),
    admin.from("classes").select("id, name").eq("school_id", schoolId).order("level_order", { ascending: true }),
    admin.from("class_subjects").select("class_id, subject_id").eq("school_id", schoolId),
  ]);

  const linkSet = new Set((links ?? []).map((l) => `${l.class_id}:${l.subject_id}`));
  const boundCreateSubject = createSubjectAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Subjects</h2>
        <div className="mt-4">
          <SubjectForm action={boundCreateSubject} />
        </div>
      </div>

      {!!subjects?.length && !!classes?.length && (
        <div>
          <h2 className="text-lg font-semibold">Which classes take which subjects</h2>
          <div className="mt-4 overflow-x-auto rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Subject</th>
                  {classes.map((c) => (
                    <th key={c.id} className="px-4 py-3 text-center font-medium">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-6 py-4">{subject.name}</td>
                    {classes.map((c) => (
                      <td key={c.id} className="px-4 py-4 text-center">
                        <ClassSubjectToggle
                          checked={linkSet.has(`${c.id}:${subject.id}`)}
                          action={toggleClassSubjectAction.bind(null, schoolId, c.id, subject.id)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
