"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import * as z from "zod";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth/token";
import { learnerSchema, guardianSchema, LEARNER_STATUSES } from "@/lib/validation/learners";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  return `${proto}://${host}`;
}

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

export interface InvitePortalResult {
  inviteLink?: string;
  message?: string;
}

async function createLearnerScopedInvite(
  schoolId: string,
  learnerId: string,
  email: string,
  role: "parent" | "learner",
  invitedBy: string
): Promise<InvitePortalResult> {
  const token = generateToken();
  const { error } = await supabaseAdmin()
    .from("invitations")
    .insert({
      school_id: schoolId,
      learner_id: learnerId,
      email,
      role,
      token_hash: hashToken(token),
      invited_by: invitedBy,
      expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { message: "There's already a pending portal invite for this email and role." };
    }
    console.error("[createLearnerScopedInvite] insert failed:", error);
    return { message: "Something went wrong creating the invite. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/learners/${learnerId}`);
  const origin = await currentOrigin();
  return { inviteLink: `${origin}/invite/${token}` };
}

export async function inviteGuardianAction(schoolId: string, learnerId: string, email: string): Promise<InvitePortalResult> {
  const { user } = await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);
  return createLearnerScopedInvite(schoolId, learnerId, email, "parent", user.id);
}

export async function inviteLearnerAction(schoolId: string, learnerId: string, email: string): Promise<InvitePortalResult> {
  const { user } = await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);
  return createLearnerScopedInvite(schoolId, learnerId, email, "learner", user.id);
}

export interface LearnerEmailFormState {
  errors?: Partial<Record<"email", string>>;
  message?: string;
}

export async function updateLearnerEmailAction(
  schoolId: string,
  learnerId: string,
  _prevState: LearnerEmailFormState,
  formData: FormData
): Promise<LearnerEmailFormState> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim() : "";
  if (email) {
    const parsed = z.email().safeParse(email);
    if (!parsed.success) {
      return { errors: { email: "Enter a valid email address." } };
    }
  }

  const { error } = await supabaseAdmin()
    .from("learners")
    .update({ email: email || null, updated_at: new Date().toISOString() })
    .eq("id", learnerId)
    .eq("school_id", schoolId);

  if (error) {
    console.error("[updateLearnerEmailAction] update failed:", error);
    return { message: "Something went wrong saving the email. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/learners/${learnerId}`);
  return {};
}
