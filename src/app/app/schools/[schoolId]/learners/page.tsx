import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createLearnerAction } from "./actions";
import { LearnerForm } from "./LearnerForm";

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  transferred: "Transferred",
};

export default async function LearnersPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const admin = supabaseAdmin();
  const [{ data: learners }, { data: classes }] = await Promise.all([
    admin
      .from("learners")
      .select("id, admission_number, first_name, last_name, status, classes(name), streams(name)")
      .eq("school_id", schoolId)
      .order("admission_number", { ascending: true }),
    admin.from("classes").select("id, name, streams(id, name)").eq("school_id", schoolId).order("level_order", { ascending: true }),
  ]);

  const boundCreateLearner = createLearnerAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Learners</h2>
        {!learners?.length ? (
          <p className="mt-3 text-sm text-white/50">No learners enrolled yet — add the first one below.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Adm. No.</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {learners.map((l) => {
                  const cls = Array.isArray(l.classes) ? l.classes[0] : l.classes;
                  const stream = Array.isArray(l.streams) ? l.streams[0] : l.streams;
                  return (
                    <tr key={l.id} className="transition hover:bg-white/[0.02]">
                      <td className="px-6 py-4 font-mono text-xs text-white/60">{l.admission_number}</td>
                      <td className="px-6 py-4">
                        <Link href={`/app/schools/${schoolId}/learners/${l.id}`} className="text-white hover:text-sky-300">
                          {l.first_name} {l.last_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-white/60">
                        {cls?.name ?? "—"}
                        {stream?.name ? ` · ${stream.name}` : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                          {STATUS_LABELS[l.status] ?? l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Enroll a learner</h2>
        <div className="mt-4">
          <LearnerForm action={boundCreateLearner} classes={classes ?? []} />
        </div>
      </div>
    </div>
  );
}
