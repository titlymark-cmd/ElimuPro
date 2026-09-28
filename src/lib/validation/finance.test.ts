import { describe, it, expect } from "vitest";
import { feeItemSchema, paymentSchema } from "./finance";

describe("feeItemSchema", () => {
  it("rejects a zero or negative amount", () => {
    expect(feeItemSchema.safeParse({ termId: "t1", name: "Tuition", amount: 0 }).success).toBe(false);
    expect(feeItemSchema.safeParse({ termId: "t1", name: "Tuition", amount: -500 }).success).toBe(false);
  });

  it("accepts a positive amount with no class (applies to whole school)", () => {
    const result = feeItemSchema.safeParse({ termId: "t1", name: "Tuition", amount: 15000 });
    expect(result.success).toBe(true);
  });
});

describe("paymentSchema", () => {
  it("rejects an unknown payment method", () => {
    const result = paymentSchema.safeParse({ amount: 1000, method: "bitcoin" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid manual M-Pesa record", () => {
    const result = paymentSchema.safeParse({ amount: 5000, method: "mpesa_manual", reference: "QGH7X2" });
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    expect(paymentSchema.safeParse({ amount: 0, method: "cash" }).success).toBe(false);
  });
});
