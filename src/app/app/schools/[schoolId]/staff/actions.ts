"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateToken, hashToken } from "@/lib/auth/token";
import { inviteSchema } from "@/lib/validation/staff";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface InviteFormState {
  errors?: Partial<Record<"email" | "role", string>>;
  message?: string;
  inviteLink?: string;
}

async function currentOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  return `${proto}://${host}`;
}

export async function createInvitationAction(schoolId: string, _prevState: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const { user } = await requireSchoolMembership(schoolId, ["school_owner", "school_admin"]);

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { errors: { email: fieldErrors.email?.[0], role: fieldErrors.role?.[0] } };
  }

  const token = generateToken();
  const { error } = await supabaseAdmin()
    .from("invitations")
    .insert({
      school_id: schoolId,
      email: parsed.data.email,
      role: parsed.data.role,
      token_hash: hashToken(token),
      invited_by: user.id,
      expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString(),
    });

  if (error) {
    if (error.message.includes("duplicate key")) {
      return { errors: { email: "There's already a pending invite for this email and role." } };
    }
    console.error("[createInvitationAction] insert failed:", error);
    return { message: "Something went wrong sending the invite. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/staff`);
  const origin = await currentOrigin();
  return { inviteLink: `${origin}/invite/${token}` };
}

export async function revokeInvitationAction(schoolId: string, invitationId: string): Promise<void> {
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin"]);

  await supabaseAdmin()
    .from("invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", invitationId)
    .eq("school_id", schoolId);

  revalidatePath(`/app/schools/${schoolId}/staff`);
}
