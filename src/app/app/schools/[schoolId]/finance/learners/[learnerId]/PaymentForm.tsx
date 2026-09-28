"use client";

import { useActionState } from "react";
import type { PaymentFormState } from "../../actions";
import { PAYMENT_METHODS } from "@/lib/validation/finance";

const initialState: PaymentFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

const METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mpesa_manual: "M-Pesa (recorded manually)",
  cheque: "Cheque",
  other: "Other",
};

interface TermOption {
  id: string;
  label: string;
}

type BoundAction = (state: PaymentFormState, formData: FormData) => Promise<PaymentFormState>;

export function PaymentForm({ action, terms }: { action: BoundAction; terms: TermOption[] }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-4 sm:items-end"
    >
      <div>
        <label htmlFor="paymentAmount" className={labelClass}>
          Amount (KES)
        </label>
        <input id="paymentAmount" name="amount" type="number" min="0" step="0.01" required className={inputClass} />
        {state.errors?.amount && <p className={errorClass}>{state.errors.amount}</p>}
      </div>
      <div>
        <label htmlFor="method" className={labelClass}>
          Method
        </label>
        <select id="method" name="method" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select
          </option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m} className="bg-[#05070f]">
              {METHOD_LABELS[m]}
            </option>
          ))}
        </select>
        {state.errors?.method && <p className={errorClass}>{state.errors.method}</p>}
      </div>
      <div>
        <label htmlFor="paymentTermId" className={labelClass}>
          Term
        </label>
        <select id="paymentTermId" name="termId" defaultValue="" className={inputClass}>
          <option value="" className="bg-[#05070f]">
            Unspecified
          </option>
          {terms.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#05070f]">
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="reference" className={labelClass}>
          Reference
        </label>
        <input id="reference" name="reference" className={inputClass} placeholder="Receipt / M-Pesa code" />
      </div>

      <div className="sm:col-span-4">
        {state.message && (
          <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Recording…" : "Record payment"}
        </button>
      </div>
    </form>
  );
}
