import { notFound, redirect } from "next/navigation";
import { requireSchoolMembership, requireUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { LearnerPortalView } from "../../LearnerPortalView";

export default async function ChildPortalPage({ params }: { params: Promise<{ schoolId: string; learnerId: string }> }) {
  const { schoolId, learnerId } = await params;
  const user = await requireUser();
  const { membership } = await requireSchoolMembership(schoolId);

  if (membership.role !== "parent") {
    redirect(`/app/schools/${schoolId}`);
  }

  // The membership check above only proves this user belongs to the
  // school as a parent — it says nothing about WHICH learner. This is
  // the check that actually scopes access to their own child: a row in
  // learner_guardians linking this exact user to this exact learner.
  const { data: guardianLink } = await supabaseAdmin()
    .from("learner_guardians")
    .select("id")
    .eq("user_id", user.id)
    .eq("learner_id", learnerId)
    .maybeSingle();

  if (!guardianLink) {
    notFound();
  }

  return (
    <LearnerPortalView schoolId={schoolId} learnerId={learnerId} backHref={`/app/schools/${schoolId}`} backLabel="Your children" />
  );
}
