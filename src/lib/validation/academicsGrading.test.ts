import { describe, it, expect } from "vitest";
import { gradingBandSchema } from "./academicsGrading";

describe("gradingBandSchema", () => {
  it("accepts a valid band", () => {
    expect(gradingBandSchema.safeParse({ label: "Exceeding Expectations", minPercent: 80, maxPercent: 100 }).success).toBe(true);
  });

  it("rejects minPercent greater than maxPercent", () => {
    expect(gradingBandSchema.safeParse({ label: "Bad band", minPercent: 90, maxPercent: 50 }).success).toBe(false);
  });

  it("rejects percentages outside 0-100", () => {
    expect(gradingBandSchema.safeParse({ label: "Too high", minPercent: 0, maxPercent: 150 }).success).toBe(false);
    expect(gradingBandSchema.safeParse({ label: "Negative", minPercent: -10, maxPercent: 50 }).success).toBe(false);
  });
});
