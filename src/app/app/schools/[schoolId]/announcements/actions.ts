"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { announcementSchema } from "@/lib/validation/announcements";

export interface AnnouncementFormState {
  errors?: Partial<Record<"title" | "body" | "targetRole", string>>;
  message?: string;
}

export async function createAnnouncementAction(
  schoolId: string,
  _prevState: AnnouncementFormState,
  formData: FormData
): Promise<AnnouncementFormState> {
  const { user } = await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher"]);

  const parsed = announcementSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    targetRole: formData.get("targetRole") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { errors: { title: fieldErrors.title?.[0], body: fieldErrors.body?.[0], targetRole: fieldErrors.targetRole?.[0] } };
  }

  const { error } = await supabaseAdmin().from("announcements").insert({
    school_id: schoolId,
    title: parsed.data.title,
    body: parsed.data.body,
    target_role: parsed.data.targetRole ?? null,
    created_by: user.id,
  });

  if (error) {
    console.error("[createAnnouncementAction] insert failed:", error);
    return { message: "Something went wrong posting the announcement. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/announcements`);
  return {};
}
