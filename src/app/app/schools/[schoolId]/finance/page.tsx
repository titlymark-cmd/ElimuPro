import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";

export default async function FinancePage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "bursar"]);

  const { data: learners } = await supabaseAdmin()
    .from("learners")
    .select("id, admission_number, first_name, last_name, classes(name)")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("admission_number", { ascending: true });

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Learner statements</h2>
        <Link
          href={`/app/schools/${schoolId}/finance/fee-structure`}
          className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Manage fee structure
        </Link>
      </div>

      {!learners?.length ? (
        <p className="text-sm text-white/50">No active learners yet.</p>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-6 py-3 font-medium">Adm. No.</th>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {learners.map((l) => {
                const cls = Array.isArray(l.classes) ? l.classes[0] : l.classes;
                return (
                  <tr key={l.id} className="transition hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-mono text-xs text-white/60">{l.admission_number}</td>
                    <td className="px-6 py-4">
                      <Link href={`/app/schools/${schoolId}/finance/learners/${l.id}`} className="text-white hover:text-sky-300">
                        {l.first_name} {l.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-white/60">{cls?.name ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
