import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { addGuardianAction, inviteGuardianAction, inviteLearnerAction, updateLearnerEmailAction, updateLearnerStatusAction } from "../actions";
import { GuardianForm } from "./GuardianForm";
import { StatusSelect } from "./StatusSelect";
import { InvitePortalButton } from "./InvitePortalButton";
import { LearnerEmailField } from "./LearnerEmailField";
import { DocumentsSection } from "./documents/DocumentsSection";

const RELATIONSHIP_LABELS: Record<string, string> = {
  mother: "Mother",
  father: "Father",
  guardian: "Guardian",
};

export default async function LearnerDetailPage({ params }: { params: Promise<{ schoolId: string; learnerId: string }> }) {
  const { schoolId, learnerId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const admin = supabaseAdmin();
  const [{ data: learner }, { data: guardians }] = await Promise.all([
    admin
      .from("learners")
      .select("id, admission_number, first_name, last_name, date_of_birth, gender, status, email, user_id, classes(name), streams(name)")
      .eq("id", learnerId)
      .eq("school_id", schoolId)
      .maybeSingle(),
    admin
      .from("learner_guardians")
      .select("id, full_name, phone, email, relationship, is_primary, user_id")
      .eq("learner_id", learnerId)
      .order("is_primary", { ascending: false }),
  ]);

  if (!learner) notFound();

  const cls = Array.isArray(learner.classes) ? learner.classes[0] : learner.classes;
  const stream = Array.isArray(learner.streams) ? learner.streams[0] : learner.streams;
  const boundAddGuardian = addGuardianAction.bind(null, schoolId, learnerId);
  const boundUpdateStatus = updateLearnerStatusAction.bind(null, schoolId, learnerId);
  const boundUpdateEmail = updateLearnerEmailAction.bind(null, schoolId, learnerId);

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/app/schools/${schoolId}/learners`} className="text-xs font-medium text-white/40 hover:text-white/60">
          ← All learners
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              {learner.first_name} {learner.last_name}
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Adm. No. {learner.admission_number} · {cls?.name ?? "No class"}
              {stream?.name ? ` · ${stream.name}` : ""}
            </p>
          </div>
          <StatusSelect current={learner.status} action={boundUpdateStatus} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Learner portal access</h3>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/50">Learner&apos;s own email (optional)</p>
          <LearnerEmailField action={boundUpdateEmail} currentEmail={learner.email} />
          <div className="mt-3">
            {learner.user_id ? (
              <p className="text-xs text-emerald-300">Has portal access</p>
            ) : learner.email ? (
              <InvitePortalButton action={inviteLearnerAction.bind(null, schoolId, learnerId, learner.email)} label="Invite to portal" />
            ) : (
              <p className="text-xs text-white/30">Add an email above to invite this learner to their own portal.</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Guardians</h3>
        {!guardians?.length ? (
          <p className="mt-3 text-sm text-white/50">No guardians on file yet.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {guardians.map((g) => (
              <div key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">{g.full_name}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs text-white/60">
                    {RELATIONSHIP_LABELS[g.relationship] ?? g.relationship}
                  </span>
                  {g.is_primary && (
                    <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-xs text-sky-300">Primary</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/50">{[g.phone, g.email].filter(Boolean).join(" · ") || "No contact info"}</p>
                {g.user_id ? (
                  <p className="mt-2 text-xs text-emerald-300">Has portal access</p>
                ) : g.email ? (
                  <div className="mt-2">
                    <InvitePortalButton action={inviteGuardianAction.bind(null, schoolId, learnerId, g.email)} label="Invite to portal" />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-white/30">Add an email to invite this guardian to the portal.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Add guardian</h3>
        <div className="mt-4">
          <GuardianForm action={boundAddGuardian} />
        </div>
      </div>

      <DocumentsSection schoolId={schoolId} learnerId={learnerId} />
    </div>
  );
}
