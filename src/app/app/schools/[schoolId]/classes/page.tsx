import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createClassAction, createStreamAction } from "./actions";
import { ClassForm } from "./ClassForm";
import { StreamForm } from "./StreamForm";

const LEVEL_LABELS: Record<string, string> = {
  primary: "Primary",
  junior_secondary: "Junior Secondary",
  senior_secondary: "Senior Secondary",
};

export default async function ClassesPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const { data: classes } = await supabaseAdmin()
    .from("classes")
    .select("id, name, education_level, level_order, streams(id, name)")
    .eq("school_id", schoolId)
    .order("level_order", { ascending: true });

  const boundCreateClass = createClassAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Classes</h2>
        {!classes?.length ? (
          <p className="mt-3 text-sm text-white/50">No classes yet — add the first one below.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {classes.map((cls) => {
              const boundCreateStream = createStreamAction.bind(null, schoolId, cls.id);
              return (
                <div key={cls.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-semibold">{cls.name}</h3>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-0.5 text-xs text-white/60">
                      {LEVEL_LABELS[cls.education_level] ?? cls.education_level}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {cls.streams?.map((stream) => (
                      <span
                        key={stream.id}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70"
                      >
                        {stream.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4">
                    <StreamForm action={boundCreateStream} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Add class</h2>
        <div className="mt-4">
          <ClassForm action={boundCreateClass} />
        </div>
      </div>
    </div>
  );
}
