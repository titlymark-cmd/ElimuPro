"use server";

import { revalidatePath } from "next/cache";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { feeItemSchema, paymentSchema } from "@/lib/validation/finance";

const FINANCE_ROLES = ["school_owner", "school_admin", "bursar"] as const;

export interface FeeItemFormState {
  errors?: Partial<Record<"termId" | "classId" | "name" | "amount", string>>;
  message?: string;
}

export async function createFeeItemAction(schoolId: string, _prevState: FeeItemFormState, formData: FormData): Promise<FeeItemFormState> {
  await requireSchoolMembership(schoolId, [...FINANCE_ROLES]);

  const parsed = feeItemSchema.safeParse({
    termId: formData.get("termId"),
    classId: formData.get("classId") || undefined,
    name: formData.get("name"),
    amount: formData.get("amount"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        termId: fieldErrors.termId?.[0],
        classId: fieldErrors.classId?.[0],
        name: fieldErrors.name?.[0],
        amount: fieldErrors.amount?.[0],
      },
    };
  }

  const { error } = await supabaseAdmin().from("fee_structure_items").insert({
    school_id: schoolId,
    term_id: parsed.data.termId,
    class_id: parsed.data.classId,
    name: parsed.data.name,
    amount: parsed.data.amount,
  });

  if (error) {
    console.error("[createFeeItemAction] insert failed:", error);
    return { message: "Something went wrong adding the fee item. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/finance/fee-structure`);
  return {};
}

export interface PaymentFormState {
  errors?: Partial<Record<"amount" | "method" | "termId" | "reference", string>>;
  message?: string;
}

export async function recordPaymentAction(
  schoolId: string,
  learnerId: string,
  _prevState: PaymentFormState,
  formData: FormData
): Promise<PaymentFormState> {
  const { user } = await requireSchoolMembership(schoolId, [...FINANCE_ROLES]);

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    method: formData.get("method"),
    termId: formData.get("termId") || undefined,
    reference: formData.get("reference") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        amount: fieldErrors.amount?.[0],
        method: fieldErrors.method?.[0],
        termId: fieldErrors.termId?.[0],
        reference: fieldErrors.reference?.[0],
      },
    };
  }

  const { error } = await supabaseAdmin().from("payments").insert({
    school_id: schoolId,
    learner_id: learnerId,
    term_id: parsed.data.termId,
    amount: parsed.data.amount,
    method: parsed.data.method,
    reference: parsed.data.reference || null,
    recorded_by: user.id,
  });

  if (error) {
    console.error("[recordPaymentAction] insert failed:", error);
    return { message: "Something went wrong recording the payment. Please try again." };
  }

  revalidatePath(`/app/schools/${schoolId}/finance/learners/${learnerId}`);
  return {};
}

export async function reversePaymentAction(schoolId: string, learnerId: string, paymentId: string): Promise<void> {
  const { user } = await requireSchoolMembership(schoolId, [...FINANCE_ROLES]);

  const admin = supabaseAdmin();
  const { data: original, error: fetchError } = await admin
    .from("payments")
    .select("id, amount, term_id, reversal_of_payment_id")
    .eq("id", paymentId)
    .eq("school_id", schoolId)
    .eq("learner_id", learnerId)
    .maybeSingle();

  if (fetchError || !original) {
    console.error("[reversePaymentAction] lookup failed:", fetchError);
    return;
  }
  if (original.reversal_of_payment_id) {
    // Reversals themselves can't be reversed through this action — that
    // would just be re-applying the original payment, which should go
    // through recordPaymentAction as a fresh, intentional entry instead.
    return;
  }

  const { error: insertError } = await admin.from("payments").insert({
    school_id: schoolId,
    learner_id: learnerId,
    term_id: original.term_id,
    amount: -original.amount,
    method: "other",
    reference: "Reversal",
    recorded_by: user.id,
    reversal_of_payment_id: original.id,
  });

  if (insertError) {
    console.error("[reversePaymentAction] insert failed:", insertError);
    return;
  }

  revalidatePath(`/app/schools/${schoolId}/finance/learners/${learnerId}`);
}
