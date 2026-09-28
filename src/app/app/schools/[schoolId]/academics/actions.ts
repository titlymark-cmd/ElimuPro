"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { subjectSchema, gradingBandSchema, assessmentSchema } from "@/lib/validation/academicsGrading";

const ACADEMIC_MANAGE_ROLES = ["school_owner", "school_admin", "headteacher"] as const;

export interface SubjectFormState {
  errors?: Partial<Record<"name", string>>;
  message?: string;
}

export async function createSubjectAction(schoolId: string, _prevState: SubjectFormState, formData: FormData): Promise<SubjectFormState> {
  await requireSchoolMembership(schoolId, [...ACADEMIC_MANAGE_ROLES]);

  const parsed = subjectSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { errors: { name: parsed.error.flatten().fieldErrors.name?.[0] } };
  }

  const { error } = await supabaseAdmin().from("subjects").insert({ school_id: schoolId, name: parsed.data.name });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { errors: { name: "A subject with this name already exists." } };
    }
    console.error("[createSubjectAction] insert failed:", error);
    return { message: "Something went wrong adding the subject. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/academics/subjects`);
  return {};
}

export async function toggleClassSubjectAction(
  schoolId: string,
  classId: string,
  subjectId: string,
  enabled: boolean
): Promise<void> {
  await requireSchoolMembership(schoolId, [...ACADEMIC_MANAGE_ROLES]);

  const admin = supabaseAdmin();
  if (enabled) {
    await admin.from("class_subjects").insert({ school_id: schoolId, class_id: classId, subject_id: subjectId });
  } else {
    await admin.from("class_subjects").delete().eq("school_id", schoolId).eq("class_id", classId).eq("subject_id", subjectId);
  }

  revalidatePath(`/app/schools/${schoolId}/academics/subjects`);
}

export interface GradingBandFormState {
  errors?: Partial<Record<"label" | "minPercent" | "maxPercent", string>>;
  message?: string;
}

export async function createGradingBandAction(
  schoolId: string,
  _prevState: GradingBandFormState,
  formData: FormData
): Promise<GradingBandFormState> {
  await requireSchoolMembership(schoolId, [...ACADEMIC_MANAGE_ROLES]);

  const parsed = gradingBandSchema.safeParse({
    label: formData.get("label"),
    minPercent: formData.get("minPercent"),
    maxPercent: formData.get("maxPercent"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { errors: { label: fieldErrors.label?.[0], minPercent: fieldErrors.minPercent?.[0], maxPercent: fieldErrors.maxPercent?.[0] } };
  }

  const { error } = await supabaseAdmin().from("grading_bands").insert({
    school_id: schoolId,
    label: parsed.data.label,
    min_percent: parsed.data.minPercent,
    max_percent: parsed.data.maxPercent,
  });

  if (error) {
    if (error.message.includes("exclude") || error.message.includes("conflict")) {
      return { errors: { maxPercent: "This range overlaps an existing grading band." } };
    }
    console.error("[createGradingBandAction] insert failed:", error);
    return { message: "Something went wrong adding the grading band. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/academics/grading`);
  return {};
}

export interface AssessmentFormState {
  errors?: Partial<Record<"classId" | "subjectId" | "termId" | "name" | "maxScore", string>>;
  message?: string;
}

export async function createAssessmentAction(
  schoolId: string,
  _prevState: AssessmentFormState,
  formData: FormData
): Promise<AssessmentFormState> {
  await requireSchoolMembership(schoolId, [...ACADEMIC_MANAGE_ROLES, "teacher"]);

  const parsed = assessmentSchema.safeParse({
    classId: formData.get("classId"),
    subjectId: formData.get("subjectId"),
    termId: formData.get("termId"),
    name: formData.get("name"),
    maxScore: formData.get("maxScore"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])),
    };
  }

  const { data, error } = await supabaseAdmin()
    .from("assessments")
    .insert({
      school_id: schoolId,
      class_id: parsed.data.classId,
      subject_id: parsed.data.subjectId,
      term_id: parsed.data.termId,
      name: parsed.data.name,
      max_score: parsed.data.maxScore,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[createAssessmentAction] insert failed:", error);
    return { message: "Something went wrong creating the assessment. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/academics/assessments`);
  return {};
}

export async function saveMarkAction(schoolId: string, assessmentId: string, learnerId: string, score: number): Promise<void> {
  const { user } = await requireSchoolMembership(schoolId, [...ACADEMIC_MANAGE_ROLES, "teacher"]);

  const { error } = await supabaseAdmin().rpc("upsert_mark", {
    p_assessment_id: assessmentId,
    p_learner_id: learnerId,
    p_score: score,
    p_recorded_by: user.id,
  });

  if (error) {
    console.error("[saveMarkAction] RPC failed:", error);
    throw new Error("Failed to save mark.");
  }

  revalidatePath(`/app/schools/${schoolId}/academics/assessments/${assessmentId}`);
}
