"use client";

import { useActionState } from "react";
import type { GuardianFormState } from "../actions";
import { GUARDIAN_RELATIONSHIPS } from "@/lib/validation/learners";

const initialState: GuardianFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

const RELATIONSHIP_LABELS: Record<(typeof GUARDIAN_RELATIONSHIPS)[number], string> = {
  mother: "Mother",
  father: "Father",
  guardian: "Guardian",
};

type BoundAction = (state: GuardianFormState, formData: FormData) => Promise<GuardianFormState>;

export function GuardianForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-2"
    >
      <div>
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input id="fullName" name="fullName" required className={inputClass} />
        {state.errors?.fullName && <p className={errorClass}>{state.errors.fullName}</p>}
      </div>
      <div>
        <label htmlFor="relationship" className={labelClass}>
          Relationship
        </label>
        <select id="relationship" name="relationship" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select
          </option>
          {GUARDIAN_RELATIONSHIPS.map((r) => (
            <option key={r} value={r} className="bg-[#05070f]">
              {RELATIONSHIP_LABELS[r]}
            </option>
          ))}
        </select>
        {state.errors?.relationship && <p className={errorClass}>{state.errors.relationship}</p>}
      </div>
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone
        </label>
        <input id="phone" name="phone" className={inputClass} placeholder="07xx xxx xxx" />
        {state.errors?.phone && <p className={errorClass}>{state.errors.phone}</p>}
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" className={inputClass} />
        {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
      </div>
      <label className="flex items-center gap-2 text-xs text-white/60 sm:col-span-2">
        <input type="checkbox" name="isPrimary" className="rounded border-white/20 bg-white/[0.04]" />
        Primary contact
      </label>

      <div className="sm:col-span-2">
        {state.message && (
          <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add guardian"}
        </button>
      </div>
    </form>
  );
}
