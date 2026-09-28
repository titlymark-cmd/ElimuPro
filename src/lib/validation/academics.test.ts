import { describe, it, expect } from "vitest";
import { academicYearSchema, classSchema } from "./academics";

const validYear = {
  name: "2026",
  startDate: "2026-01-05",
  endDate: "2026-11-20",
  term1Start: "2026-01-05",
  term1End: "2026-04-10",
  term2Start: "2026-05-04",
  term2End: "2026-08-07",
  term3Start: "2026-08-31",
  term3End: "2026-11-20",
};

describe("academicYearSchema", () => {
  it("accepts a well-formed, sequential academic year", () => {
    expect(academicYearSchema.safeParse(validYear).success).toBe(true);
  });

  it("rejects when the academic year end is before its start", () => {
    const result = academicYearSchema.safeParse({ ...validYear, startDate: "2026-12-01", endDate: "2026-01-01" });
    expect(result.success).toBe(false);
  });

  it("rejects overlapping terms (term 2 starting before term 1 ends)", () => {
    const result = academicYearSchema.safeParse({ ...validYear, term2Start: "2026-03-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a term starting before the academic year does", () => {
    const result = academicYearSchema.safeParse({ ...validYear, term1Start: "2025-12-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a term ending after the academic year does", () => {
    const result = academicYearSchema.safeParse({ ...validYear, term3End: "2026-12-31" });
    expect(result.success).toBe(false);
  });
});

describe("classSchema", () => {
  it("accepts a valid class", () => {
    expect(classSchema.safeParse({ name: "Grade 4", educationLevel: "primary", levelOrder: 4 }).success).toBe(true);
  });

  it("rejects an unknown education level", () => {
    expect(classSchema.safeParse({ name: "Grade 4", educationLevel: "college", levelOrder: 4 }).success).toBe(false);
  });

  it("rejects a non-positive level order", () => {
    expect(classSchema.safeParse({ name: "Grade 4", educationLevel: "primary", levelOrder: 0 }).success).toBe(false);
  });
});
