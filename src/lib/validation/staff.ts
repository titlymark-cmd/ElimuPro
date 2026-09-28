import * as z from "zod";

export const STAFF_ROLES = ["school_admin", "headteacher", "deputy_headteacher", "bursar", "teacher"] as const;

export const inviteSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  role: z.enum(STAFF_ROLES, { error: "Choose a role." }),
});

export type InviteInput = z.infer<typeof inviteSchema>;

export const acceptInvitationSchema = z
  .object({
    fullName: z.string().trim().optional(),
    password: z.string().optional(),
  })
  .refine((v) => !v.password || v.password.length >= 8, {
    error: "Password must be at least 8 characters.",
    path: ["password"],
  });
