import * as z from "zod";

export const subjectSchema = z.object({
  name: z.string().trim().min(2, "Enter a subject name."),
});

export const classSubjectSchema = z.object({
  classId: z.string().min(1, "Choose a class."),
  subjectId: z.string().min(1, "Choose a subject."),
});

export const gradingBandSchema = z
  .object({
    label: z.string().trim().min(1, "Enter a label, e.g. Exceeding Expectations."),
    minPercent: z.coerce.number().min(0).max(100),
    maxPercent: z.coerce.number().min(0).max(100),
  })
  .refine((v) => v.minPercent <= v.maxPercent, {
    error: "Minimum must be less than or equal to maximum.",
    path: ["maxPercent"],
  });

export const assessmentSchema = z.object({
  classId: z.string().min(1, "Choose a class."),
  subjectId: z.string().min(1, "Choose a subject."),
  termId: z.string().min(1, "Choose a term."),
  name: z.string().trim().min(2, "Enter an assessment name."),
  maxScore: z.coerce.number().positive("Enter a maximum score greater than 0."),
});
