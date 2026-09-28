"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";

const ATTENDANCE_STATUSES = ["present", "absent", "late", "excused"] as const;

export async function saveAttendanceAction(
  schoolId: string,
  classId: string,
  date: string,
  learnerId: string,
  status: string
): Promise<void> {
  const { user } = await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "headteacher", "teacher"]);

  if (!ATTENDANCE_STATUSES.includes(status as (typeof ATTENDANCE_STATUSES)[number])) {
    throw new Error("Invalid status.");
  }

  const { error } = await supabaseAdmin().rpc("upsert_attendance", {
    p_school_id: schoolId,
    p_learner_id: learnerId,
    p_class_id: classId,
    p_date: date,
    p_status: status,
    p_recorded_by: user.id,
  });

  if (error) {
    console.error("[saveAttendanceAction] RPC failed:", error);
    throw new Error("Failed to save attendance.");
  }

  revalidatePath(`/app/schools/${schoolId}/academics/attendance`);
}
