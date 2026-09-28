import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { saveAttendanceAction } from "./actions";
import { AttendanceGrid } from "./AttendanceGrid";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher", "teacher"]);

  const sp = await searchParams;
  const date = sp.date ?? todayIso();

  const admin = supabaseAdmin();
  const { data: classes } = await admin.from("classes").select("id, name").eq("school_id", schoolId).order("level_order", { ascending: true });

  const classId = sp.classId ?? classes?.[0]?.id;

  const [{ data: learners }, { data: records }] = await Promise.all([
    classId
      ? admin
          .from("learners")
          .select("id, admission_number, first_name, last_name")
          .eq("school_id", schoolId)
          .eq("class_id", classId)
          .eq("status", "active")
          .order("admission_number", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; admission_number: string; first_name: string; last_name: string }[] }),
    classId
      ? admin.from("attendance_records").select("learner_id, status").eq("school_id", schoolId).eq("class_id", classId).eq("date", date)
      : Promise.resolve({ data: [] as { learner_id: string; status: string }[] }),
  ]);

  const statusByLearner = new Map((records ?? []).map((r) => [r.learner_id, r.status]));
  const rows = (learners ?? []).map((l) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name}`,
    admissionNumber: l.admission_number,
    status: statusByLearner.get(l.id) ?? null,
  }));

  const boundSave = classId ? saveAttendanceAction.bind(null, schoolId, classId, date) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Attendance</h2>
        <form method="get" className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="classId" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
              Class
            </label>
            <select
              id="classId"
              name="classId"
              defaultValue={classId ?? ""}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/50"
            >
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.id} className="bg-[#05070f]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={date}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-sky-400/50"
            />
          </div>
          <button
            type="submit"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Go
          </button>
        </form>
      </div>

      {!rows.length ? (
        <p className="text-sm text-white/50">No active learners in this class.</p>
      ) : boundSave ? (
        <AttendanceGrid learners={rows} action={boundSave} />
      ) : null}
    </div>
  );
}
