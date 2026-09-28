import { notFound, redirect } from "next/navigation";
import { requireSchoolMembership, requireUser } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { LearnerPortalView } from "../LearnerPortalView";

export default async function MyPortalPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  const user = await requireUser();
  const { membership } = await requireSchoolMembership(schoolId);

  if (membership.role !== "learner") {
    redirect(`/app/schools/${schoolId}`);
  }

  // Same principle as the parent portal: membership only proves "this
  // user is a learner at this school" — the actual scoping to THEIR OWN
  // record is learners.user_id matching this exact user.
  const { data: learner } = await supabaseAdmin()
    .from("learners")
    .select("id")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!learner) {
    notFound();
  }

  return <LearnerPortalView schoolId={schoolId} learnerId={learner.id} backHref={`/app/schools/${schoolId}`} backLabel="Overview" />;
}
