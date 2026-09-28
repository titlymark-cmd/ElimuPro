"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { classSchema, streamSchema } from "@/lib/validation/academics";

export interface ClassFormState {
  errors?: Partial<Record<"name" | "educationLevel" | "levelOrder", string>>;
  message?: string;
}

export async function createClassAction(schoolId: string, _prevState: ClassFormState, formData: FormData): Promise<ClassFormState> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const parsed = classSchema.safeParse({
    name: formData.get("name"),
    educationLevel: formData.get("educationLevel"),
    levelOrder: formData.get("levelOrder"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        educationLevel: fieldErrors.educationLevel?.[0],
        levelOrder: fieldErrors.levelOrder?.[0],
      },
    };
  }

  const { error } = await supabaseAdmin().from("classes").insert({
    school_id: schoolId,
    name: parsed.data.name,
    education_level: parsed.data.educationLevel,
    level_order: parsed.data.levelOrder,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { errors: { name: "A class with this name already exists." } };
    }
    console.error("[createClassAction] insert failed:", error);
    return { message: "Something went wrong creating the class. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/classes`);
  return {};
}

export interface StreamFormState {
  errors?: Partial<Record<"name", string>>;
  message?: string;
}

export async function createStreamAction(
  schoolId: string,
  classId: string,
  _prevState: StreamFormState,
  formData: FormData
): Promise<StreamFormState> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const parsed = streamSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { errors: { name: parsed.error.flatten().fieldErrors.name?.[0] } };
  }

  const { error } = await supabaseAdmin().from("streams").insert({
    school_id: schoolId,
    class_id: classId,
    name: parsed.data.name,
  });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { errors: { name: "A stream with this name already exists in this class." } };
    }
    console.error("[createStreamAction] insert failed:", error);
    return { message: "Something went wrong adding the stream. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/classes`);
  return {};
}
