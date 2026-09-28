import * as z from "zod";

export const ANNOUNCEMENT_ROLES = [
  "school_owner",
  "school_admin",
  "headteacher",
  "deputy_headteacher",
  "bursar",
  "teacher",
  "parent",
  "learner",
] as const;

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Enter a title."),
  body: z.string().trim().min(2, "Enter a message."),
  targetRole: z.enum(ANNOUNCEMENT_ROLES).optional(),
});
