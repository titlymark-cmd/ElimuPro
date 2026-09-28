import * as z from "zod";

const optionalUuid = z
  .string()
  .optional()
  .transform((v) => (v ? v : null));

export const feeItemSchema = z.object({
  termId: z.string().min(1, "Choose a term."),
  classId: optionalUuid,
  name: z.string().trim().min(2, "Enter a fee name, e.g. Tuition."),
  amount: z.coerce.number().positive("Enter an amount greater than 0."),
});

export type FeeItemInput = z.infer<typeof feeItemSchema>;

export const PAYMENT_METHODS = ["cash", "bank_transfer", "mpesa_manual", "cheque", "other"] as const;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0."),
  method: z.enum(PAYMENT_METHODS, { error: "Choose a payment method." }),
  termId: optionalUuid,
  reference: z.string().trim().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
