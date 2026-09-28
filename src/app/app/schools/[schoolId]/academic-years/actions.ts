"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { academicYearSchema } from "@/lib/validation/academics";

export interface AcademicYearFormState {
  errors?: Partial<
    Record<
      "name" | "startDate" | "endDate" | "term1Start" | "term1End" | "term2Start" | "term2End" | "term3Start" | "term3End",
      string
    >
  >;
  message?: string;
}

export async function createAcademicYearAction(
  schoolId: string,
  _prevState: AcademicYearFormState,
  formData: FormData
): Promise<AcademicYearFormState> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const parsed = academicYearSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    term1Start: formData.get("term1Start"),
    term1End: formData.get("term1End"),
    term2Start: formData.get("term2Start"),
    term2End: formData.get("term2End"),
    term3Start: formData.get("term3Start"),
    term3End: formData.get("term3End"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: Object.fromEntries(Object.entries(fieldErrors).map(([k, v]) => [k, v?.[0]])),
    };
  }

  const d = parsed.data;
  const { error } = await supabaseAdmin().rpc("create_academic_year_with_terms", {
    p_school_id: schoolId,
    p_name: d.name,
    p_start_date: d.startDate,
    p_end_date: d.endDate,
    p_term1_start: d.term1Start,
    p_term1_end: d.term1End,
    p_term2_start: d.term2Start,
    p_term2_end: d.term2End,
    p_term3_start: d.term3Start,
    p_term3_end: d.term3End,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { errors: { name: "An academic year with this name already exists." } };
    }
    console.error("[createAcademicYearAction] RPC failed:", error);
    return { message: "Something went wrong creating the academic year. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/academic-years`);
  revalidatePath(`/app/schools/${schoolId}`);
  return {};
}
