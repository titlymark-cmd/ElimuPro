import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createGradingBandAction } from "../actions";
import { GradingBandForm } from "./GradingBandForm";

export default async function GradingPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const { data: bands } = await supabaseAdmin()
    .from("grading_bands")
    .select("id, label, min_percent, max_percent")
    .eq("school_id", schoolId)
    .order("min_percent", { ascending: false });

  const boundCreateBand = createGradingBandAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Grading scale</h2>
        <p className="mt-1 text-sm text-white/50">
          Define your own scale — CBC performance levels, letter grades, or anything else. Ranges can&apos;t overlap.
        </p>
        {!bands?.length ? (
          <p className="mt-4 text-sm text-white/50">No grading bands defined yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {bands.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3">
                <span className="text-sm text-white">{b.label}</span>
                <span className="text-xs text-white/50">
                  {Number(b.min_percent)}% – {Number(b.max_percent)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Add grading band</h2>
        <div className="mt-4">
          <GradingBandForm action={boundCreateBand} />
        </div>
      </div>
    </div>
  );
}
