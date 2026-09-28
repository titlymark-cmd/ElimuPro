"use client";

import { useActionState } from "react";
import type { GradingBandFormState } from "../actions";

const initialState: GradingBandFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

type BoundAction = (state: GradingBandFormState, formData: FormData) => Promise<GradingBandFormState>;

export function GradingBandForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-4 sm:items-end"
    >
      <div className="sm:col-span-2">
        <label htmlFor="label" className={labelClass}>
          Label
        </label>
        <input id="label" name="label" required className={inputClass} placeholder="e.g. Exceeding Expectations" />
        {state.errors?.label && <p className={errorClass}>{state.errors.label}</p>}
      </div>
      <div>
        <label htmlFor="minPercent" className={labelClass}>
          Min %
        </label>
        <input id="minPercent" name="minPercent" type="number" min="0" max="100" step="0.01" required className={inputClass} />
        {state.errors?.minPercent && <p className={errorClass}>{state.errors.minPercent}</p>}
      </div>
      <div>
        <label htmlFor="maxPercent" className={labelClass}>
          Max %
        </label>
        <input id="maxPercent" name="maxPercent" type="number" min="0" max="100" step="0.01" required className={inputClass} />
        {state.errors?.maxPercent && <p className={errorClass}>{state.errors.maxPercent}</p>}
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
          {pending ? "Adding…" : "Add band"}
        </button>
      </div>
    </form>
  );
}
