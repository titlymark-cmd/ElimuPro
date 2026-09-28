import * as z from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");
const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v ? v : null));

export const learnerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name."),
  lastName: z.string().trim().min(1, "Enter a last name."),
  dateOfBirth: isoDate.optional().or(z.literal("")).transform((v) => (v ? v : null)),
  gender: z.enum(["male", "female"], { error: "Choose a gender." }),
  classId: optionalUuid,
  streamId: optionalUuid,
});

export type LearnerInput = z.infer<typeof learnerSchema>;

export const GUARDIAN_RELATIONSHIPS = ["mother", "father", "guardian"] as const;

export const guardianSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the guardian's full name."),
  phone: z.string().trim().optional(),
  email: z.email("Enter a valid email address.").optional().or(z.literal("")),
  relationship: z.enum(GUARDIAN_RELATIONSHIPS, { error: "Choose a relationship." }),
  isPrimary: z.boolean().optional(),
});

export type GuardianInput = z.infer<typeof guardianSchema>;

export const LEARNER_STATUSES = ["active", "inactive", "graduated", "transferred"] as const;
