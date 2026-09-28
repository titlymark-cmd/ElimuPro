import { describe, it, expect } from "vitest";
import { slugify, signupSchema, loginSchema } from "./auth";

describe("slugify", () => {
  it("lowercases and hyphenates a normal school name", () => {
    expect(slugify("Green Hills Academy")).toBe("green-hills-academy");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("St. Mary's  --  School!!")).toBe("st-mary-s-school");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  !!Weird Name!!  ")).toBe("weird-name");
  });

  it("caps length at 60 characters", () => {
    const long = "A".repeat(100);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });
});

describe("signupSchema", () => {
  it("accepts a well-formed signup", () => {
    const result = signupSchema.safeParse({
      schoolName: "Green Hills Academy",
      category: "day",
      fullName: "Jane Wanjiru",
      email: "jane@school.ac.ke",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a password with no digit", () => {
    const result = signupSchema.safeParse({
      schoolName: "Green Hills Academy",
      category: "day",
      fullName: "Jane Wanjiru",
      email: "jane@school.ac.ke",
      password: "passwordonly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid category", () => {
    const result = signupSchema.safeParse({
      schoolName: "Green Hills Academy",
      category: "night",
      fullName: "Jane Wanjiru",
      email: "jane@school.ac.ke",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("lowercases the email", () => {
    const result = signupSchema.safeParse({
      schoolName: "Green Hills Academy",
      category: "day",
      fullName: "Jane Wanjiru",
      email: "JANE@SCHOOL.AC.KE",
      password: "password123",
    });
    expect(result.success && result.data.email).toBe("jane@school.ac.ke");
  });
});

describe("loginSchema", () => {
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});
