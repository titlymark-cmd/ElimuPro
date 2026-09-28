"use client";

import { useActionState } from "react";
import type { FeeItemFormState } from "../actions";

const initialState: FeeItemFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

interface TermOption {
  id: string;
  label: string;
}
interface ClassOption {
  id: string;
  name: string;
}

type BoundAction = (state: FeeItemFormState, formData: FormData) => Promise<FeeItemFormState>;

export function FeeItemForm({ action, terms, classes }: { action: BoundAction; terms: TermOption[]; classes: ClassOption[] }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-4 sm:items-end"
    >
      <div className="sm:col-span-2">
        <label htmlFor="feeName" className={labelClass}>
          Fee name
        </label>
        <input id="feeName" name="name" required className={inputClass} placeholder="e.g. Tuition" />
        {state.errors?.name && <p className={errorClass}>{state.errors.name}</p>}
      </div>
      <div>
        <label htmlFor="amount" className={labelClass}>
          Amount (KES)
        </label>
        <input id="amount" name="amount" type="number" min="0" step="0.01" required className={inputClass} placeholder="15000" />
        {state.errors?.amount && <p className={errorClass}>{state.errors.amount}</p>}
      </div>
      <div>
        <label htmlFor="termId" className={labelClass}>
          Term
        </label>
        <select id="termId" name="termId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select
          </option>
          {terms.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#05070f]">
              {t.label}
            </option>
          ))}
        </select>
        {state.errors?.termId && <p className={errorClass}>{state.errors.termId}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="classId" className={labelClass}>
          Class
        </label>
        <select id="classId" name="classId" defaultValue="" className={inputClass}>
          <option value="" className="bg-[#05070f]">
            All classes
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#05070f]">
              {c.name}
            </option>
          ))}
        </select>
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
          {pending ? "Adding…" : "Add fee item"}
        </button>
      </div>
    </form>
  );
}
