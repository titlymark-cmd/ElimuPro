import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createFeeItemAction } from "../actions";
import { FeeItemForm } from "./FeeItemForm";

export default async function FeeStructurePage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "bursar"]);

  const admin = supabaseAdmin();
  const [{ data: items }, { data: terms }, { data: classes }] = await Promise.all([
    admin
      .from("fee_structure_items")
      .select("id, name, amount, terms(name, academic_years(name)), classes(name)")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    admin
      .from("terms")
      .select("id, name, academic_years(name)")
      .eq("school_id", schoolId)
      .order("start_date", { ascending: false }),
    admin.from("classes").select("id, name").eq("school_id", schoolId).order("level_order", { ascending: true }),
  ]);

  const termOptions = (terms ?? []).map((t) => {
    const year = Array.isArray(t.academic_years) ? t.academic_years[0] : t.academic_years;
    return { id: t.id, label: `${t.name} (${year?.name ?? "—"})` };
  });

  const boundCreateFeeItem = createFeeItemAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Fee structure</h2>
        {!items?.length ? (
          <p className="mt-3 text-sm text-white/50">
            No fee items yet — define what&apos;s charged per term below. Create an academic year first if none exists.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Term</th>
                  <th className="px-6 py-3 font-medium">Class</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => {
                  const term = Array.isArray(item.terms) ? item.terms[0] : item.terms;
                  const cls = Array.isArray(item.classes) ? item.classes[0] : item.classes;
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4 text-white/60">{term?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-white/60">{cls?.name ?? "All classes"}</td>
                      <td className="px-6 py-4">KES {Number(item.amount).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Add fee item</h2>
        <div className="mt-4">
          <FeeItemForm action={boundCreateFeeItem} terms={termOptions} classes={classes ?? []} />
        </div>
      </div>
    </div>
  );
}
