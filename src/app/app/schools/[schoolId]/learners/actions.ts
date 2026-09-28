"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { learnerSchema, guardianSchema, LEARNER_STATUSES } from "@/lib/validation/learners";

export interface LearnerFormState {
  errors?: Partial<Record<"firstName" | "lastName" | "dateOfBirth" | "gender" | "classId" | "streamId", string>>;
  message?: string;
}

export async function createLearnerAction(schoolId: string, _prevState: LearnerFormState, formData: FormData): Promise<LearnerFormState> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const parsed = learnerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    classId: formData.get("classId") || undefined,
    streamId: formData.get("streamId") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])),
    };
  }

  const d = parsed.data;
  const { error } = await supabaseAdmin().rpc("create_learner_with_admission_number", {
    p_school_id: schoolId,
    p_first_name: d.firstName,
    p_last_name: d.lastName,
    p_date_of_birth: d.dateOfBirth,
    p_gender: d.gender,
    p_class_id: d.classId,
    p_stream_id: d.streamId,
  });

  if (error) {
    console.error("[createLearnerAction] RPC failed:", error);
    return { message: "Something went wrong enrolling the learner. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/learners`);
  return {};
}

export async function updateLearnerStatusAction(schoolId: string, learnerId: string, status: string): Promise<void> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  if (!LEARNER_STATUSES.includes(status as (typeof LEARNER_STATUSES)[number])) {
    throw new Error("Invalid status.");
  }

  await supabaseAdmin()
    .from("learners")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", learnerId)
    .eq("school_id", schoolId);

  revalidatePath(`/app/schools/${schoolId}/learners`);
  revalidatePath(`/app/schools/${schoolId}/learners/${learnerId}`);
}

export interface GuardianFormState {
  errors?: Partial<Record<"fullName" | "phone" | "email" | "relationship", string>>;
  message?: string;
}

export async function addGuardianAction(
  schoolId: string,
  learnerId: string,
  _prevState: GuardianFormState,
  formData: FormData
): Promise<GuardianFormState> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const parsed = guardianSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    relationship: formData.get("relationship"),
    isPrimary: formData.get("isPrimary") === "on",
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        fullName: fieldErrors.fullName?.[0],
        phone: fieldErrors.phone?.[0],
        email: fieldErrors.email?.[0],
        relationship: fieldErrors.relationship?.[0],
      },
    };
  }

  const { error } = await supabaseAdmin().from("learner_guardians").insert({
    learner_id: learnerId,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone || null,
    email: parsed.data.email || null,
    relationship: parsed.data.relationship,
    is_primary: parsed.data.isPrimary ?? false,
  });

  if (error) {
    console.error("[addGuardianAction] insert failed:", error);
    return { message: "Something went wrong adding the guardian. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/learners/${learnerId}`);
  return {};
}
