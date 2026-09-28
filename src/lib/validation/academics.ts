import * as z from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const academicYearSchema = z
  .object({
    name: z.string().trim().min(2, "Enter a name, e.g. 2026."),
    startDate: isoDate,
    endDate: isoDate,
    term1Start: isoDate,
    term1End: isoDate,
    term2Start: isoDate,
    term2End: isoDate,
    term3Start: isoDate,
    term3End: isoDate,
  })
  .refine((v) => v.startDate < v.endDate, {
    error: "The academic year's end date must be after its start date.",
    path: ["endDate"],
  })
  .refine((v) => v.term1Start < v.term1End, { error: "Term 1 end must be after its start.", path: ["term1End"] })
  .refine((v) => v.term2Start < v.term2End, { error: "Term 2 end must be after its start.", path: ["term2End"] })
  .refine((v) => v.term3Start < v.term3End, { error: "Term 3 end must be after its start.", path: ["term3End"] })
  .refine((v) => v.term1End < v.term2Start, { error: "Term 1 must end before Term 2 starts.", path: ["term2Start"] })
  .refine((v) => v.term2End < v.term3Start, { error: "Term 2 must end before Term 3 starts.", path: ["term3Start"] })
  .refine((v) => v.startDate <= v.term1Start, { error: "Term 1 can't start before the academic year does.", path: ["term1Start"] })
  .refine((v) => v.term3End <= v.endDate, { error: "Term 3 can't end after the academic year does.", path: ["term3End"] });

export type AcademicYearInput = z.infer<typeof academicYearSchema>;

export const EDUCATION_LEVELS = ["primary", "junior_secondary", "senior_secondary"] as const;

export const classSchema = z.object({
  name: z.string().trim().min(1, "Enter a class name, e.g. Grade 4."),
  educationLevel: z.enum(EDUCATION_LEVELS, { error: "Choose an education level." }),
  levelOrder: z.coerce.number().int().min(1, "Enter a position number (1, 2, 3, ...)."),
});

export type ClassInput = z.infer<typeof classSchema>;

export const streamSchema = z.object({
  name: z.string().trim().min(1, "Enter a stream name, e.g. Blue."),
});

export type StreamInput = z.infer<typeof streamSchema>;
