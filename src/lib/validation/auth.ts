import * as z from "zod";

// Mirrors the Kenyan-school signup form: a school and its first owner
// account are created together (see create_school_owner_signup RPC).
export const signupSchema = z.object({
  schoolName: z.string().trim().min(2, "School name must be at least 2 characters."),
  category: z.enum(["day", "boarding", "mixed"], {
    error: "Choose whether the school is day, boarding, or mixed.",
  }),
  fullName: z.string().trim().min(2, "Enter your full name."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one number."),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Turns a school name into a URL-safe, unique-ish slug seed. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
