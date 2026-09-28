import { describe, it, expect } from "vitest";
import { gradeFor, type GradingBand } from "./grading";

const cbcBands: GradingBand[] = [
  { label: "Exceeding Expectations", min_percent: 80, max_percent: 100 },
  { label: "Meeting Expectations", min_percent: 50, max_percent: 79.99 },
  { label: "Approaching Expectations", min_percent: 30, max_percent: 49.99 },
  { label: "Below Expectations", min_percent: 0, max_percent: 29.99 },
];

describe("gradeFor", () => {
  it("picks the band whose range contains the percentage", () => {
    expect(gradeFor(85, cbcBands)).toBe("Exceeding Expectations");
    expect(gradeFor(65, cbcBands)).toBe("Meeting Expectations");
    expect(gradeFor(35, cbcBands)).toBe("Approaching Expectations");
    expect(gradeFor(10, cbcBands)).toBe("Below Expectations");
  });

  it("is inclusive at both ends of a band", () => {
    expect(gradeFor(80, cbcBands)).toBe("Exceeding Expectations");
    expect(gradeFor(100, cbcBands)).toBe("Exceeding Expectations");
    expect(gradeFor(0, cbcBands)).toBe("Below Expectations");
  });

  it("returns a placeholder when no band matches (no bands configured, or a gap)", () => {
    expect(gradeFor(50, [])).toBe("—");

    const bandsWithGap: GradingBand[] = [
      { label: "A", min_percent: 90, max_percent: 100 },
      { label: "B", min_percent: 0, max_percent: 79 },
    ];
    expect(gradeFor(85, bandsWithGap)).toBe("—");
  });
});
