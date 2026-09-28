"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createSession } from "@/lib/auth/session";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/auth/rateLimit";

export interface LoginFormState {
  errors?: Partial<Record<"email" | "password", string>>;
  message?: string;
}

export async function loginAction(_prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { errors: { email: fieldErrors.email?.[0], password: fieldErrors.password?.[0] } };
  }

  const { email, password } = parsed.data;
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent");

  if (await isLoginRateLimited(email, ipAddress)) {
    return { message: "Too many failed attempts. Please try again in 15 minutes." };
  }

  const { data: user, error } = await supabaseAdmin()
    .from("users")
    .select("id, password_hash, status")
    .eq("email", email)
    .maybeSingle();

  const genericError = { message: "Incorrect email or password." };

  if (error) {
    console.error("[loginAction] users lookup failed:", error);
    await recordLoginAttempt({ userId: null, email, ipAddress, userAgent, success: false });
    return genericError;
  }

  if (!user) {
    await recordLoginAttempt({ userId: null, email, ipAddress, userAgent, success: false });
    return genericError;
  }

  const passwordOk = await verifyPassword(password, user.password_hash);
  if (!passwordOk) {
    await recordLoginAttempt({ userId: user.id, email, ipAddress, userAgent, success: false });
    return genericError;
  }

  if (user.status !== "active") {
    await recordLoginAttempt({ userId: user.id, email, ipAddress, userAgent, success: false });
    return { message: "This account has been suspended. Contact your school administrator." };
  }

  await recordLoginAttempt({ userId: user.id, email, ipAddress, userAgent, success: true });
  await createSession(user.id);
  redirect("/app");
}
