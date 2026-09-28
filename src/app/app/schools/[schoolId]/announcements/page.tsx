import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createAnnouncementAction } from "./actions";
import { AnnouncementForm } from "./AnnouncementForm";

const ROLE_LABELS: Record<string, string> = {
  school_owner: "School Owner",
  school_admin: "School Admin",
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  bursar: "Bursar",
  teacher: "Teacher",
  parent: "Parent",
  learner: "Learner",
};

export default async function AnnouncementsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  const { membership } = await requireSchoolMembership(schoolId);

  const canPost = ["school_owner", "school_admin", "headteacher"].includes(membership.role);

  const { data: announcements } = await supabaseAdmin()
    .from("announcements")
    .select("id, title, body, target_role, created_at")
    .eq("school_id", schoolId)
    .or(`target_role.is.null,target_role.eq.${membership.role}`)
    .order("created_at", { ascending: false });

  const boundCreate = createAnnouncementAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Announcements</h2>
        {!announcements?.length ? (
          <p className="mt-3 text-sm text-white/50">No announcements yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-white">{a.title}</h3>
                  <span className="text-xs text-white/40">{new Date(a.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm text-white/70">{a.body}</p>
                {a.target_role && (
                  <span className="mt-3 inline-block rounded-full border border-sky-400/40 bg-sky-400/10 px-3 py-1 text-xs text-sky-300">
                    {ROLE_LABELS[a.target_role] ?? a.target_role} only
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {canPost && (
        <div>
          <h2 className="text-lg font-semibold">Post announcement</h2>
          <div className="mt-4">
            <AnnouncementForm action={boundCreate} />
          </div>
        </div>
      )}
    </div>
  );
}
