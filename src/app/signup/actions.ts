"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { signupSchema, slugify } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/session";

export interface SignupFormState {
  errors?: Partial<Record<"schoolName" | "category" | "fullName" | "email" | "password", string>>;
  message?: string;
}

export async function signupAction(_prevState: SignupFormState, formData: FormData): Promise<SignupFormState> {
  const parsed = signupSchema.safeParse({
    schoolName: formData.get("schoolName"),
    category: formData.get("category"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        schoolName: fieldErrors.schoolName?.[0],
        category: fieldErrors.category?.[0],
        fullName: fieldErrors.fullName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const { schoolName, category, fullName, email, password } = parsed.data;
  const slug = `${slugify(schoolName)}-${randomBytes(3).toString("hex")}`;
  const passwordHash = await hashPassword(password);

  const { data, error } = await supabaseAdmin().rpc("create_school_owner_signup", {
    p_school_name: schoolName,
    p_slug: slug,
    p_category: category,
    p_full_name: fullName,
    p_email: email,
    p_password_hash: passwordHash,
  });

  if (error) {
    if (error.message.includes("email_taken")) {
      return { errors: { email: "An account with this email already exists." } };
    }
    console.error("[signupAction] create_school_owner_signup RPC failed:", error);
    return { message: "Something went wrong creating your school. Please try again." };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.user_id) {
    return { message: "Something went wrong creating your school. Please try again." };
  }

  await createSession(row.user_id);
  redirect("/app");
}
