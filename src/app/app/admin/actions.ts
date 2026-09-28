"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { SCHOOL_STATUSES, type SchoolStatus } from "@/lib/validation/schools";

export async function updateSchoolStatusAction(schoolId: string, status: string): Promise<void> {
  await requirePlatformAdmin();

  if (!SCHOOL_STATUSES.includes(status as SchoolStatus)) {
    throw new Error("Invalid status.");
  }

  const { error } = await supabaseAdmin()
    .from("schools")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", schoolId);

  if (error) {
    console.error("[updateSchoolStatusAction] update failed:", error);
    throw new Error("Something went wrong updating the school's status.");
  }

  revalidatePath("/app/admin");
  revalidatePath(`/app/admin/${schoolId}`);
}
