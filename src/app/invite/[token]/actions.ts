"use server";

import { redirect } from "next/navigation";
import { hashToken } from "@/lib/auth/token";
import { hashPassword } from "@/lib/auth/password";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/session";

export interface AcceptInviteFormState {
  errors?: Partial<Record<"fullName" | "password", string>>;
  message?: string;
}

export async function acceptInvitationAction(
  token: string,
  _prevState: AcceptInviteFormState,
  formData: FormData
): Promise<AcceptInviteFormState> {
  const fullNameRaw = formData.get("fullName");
  const passwordRaw = formData.get("password");

  let passwordHash: string | null = null;
  if (typeof passwordRaw === "string" && passwordRaw.length > 0) {
    if (passwordRaw.length < 8) {
      return { errors: { password: "Password must be at least 8 characters." } };
    }
    passwordHash = await hashPassword(passwordRaw);
  }

  const fullName = typeof fullNameRaw === "string" && fullNameRaw.trim() ? fullNameRaw.trim() : null;

  const { data, error } = await supabaseAdmin().rpc("accept_invitation", {
    p_token_hash: hashToken(token),
    p_full_name: fullName,
    p_password_hash: passwordHash,
  });

  if (error) {
    if (error.message.includes("invitation_not_found")) return { message: "This invite link is invalid." };
    if (error.message.includes("invitation_already_accepted")) return { message: "This invite has already been used." };
    if (error.message.includes("invitation_revoked")) return { message: "This invite has been revoked." };
    if (error.message.includes("invitation_expired")) {
      return { message: "This invite has expired. Ask your school admin to send a new one." };
    }
    if (error.message.includes("name_and_password_required")) {
      return { message: "Enter your full name and a password to continue." };
    }
    console.error("[acceptInvitationAction] RPC failed:", error);
    return { message: "Something went wrong. Please try again." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { message: "Something went wrong. Please try again." };

  if (row.is_new_user) {
    // The invite token itself served as proof of email ownership for this
    // brand-new account, and the password was just set in this same
    // request — safe to log in immediately.
    await createSession(row.user_id);
    redirect(`/app/schools/${row.school_id}`);
  }

  // Existing account: only the membership was attached. Never create a
  // session here — this visitor has only proven possession of the invite
  // link, not that account's password.
  redirect("/login?invited=1");
}
