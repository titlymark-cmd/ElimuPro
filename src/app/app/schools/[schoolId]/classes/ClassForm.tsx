"use client";

import { useActionState } from "react";
import type { ClassFormState } from "./actions";
import { EDUCATION_LEVELS } from "@/lib/validation/academics";

const initialState: ClassFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

const LEVEL_LABELS: Record<(typeof EDUCATION_LEVELS)[number], string> = {
  primary: "Primary",
  junior_secondary: "Junior Secondary",
  senior_secondary: "Senior Secondary",
};

type BoundAction = (state: ClassFormState, formData: FormData) => Promise<ClassFormState>;

export function ClassForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-4 sm:items-end">
      <div className="sm:col-span-2">
        <label htmlFor="className" className={labelClass}>
          Class name
        </label>
        <input id="className" name="name" required className={inputClass} placeholder="e.g. Grade 4" />
        {state.errors?.name && <p className={errorClass}>{state.errors.name}</p>}
      </div>
      <div>
        <label htmlFor="educationLevel" className={labelClass}>
          Level
        </label>
        <select id="educationLevel" name="educationLevel" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select
          </option>
          {EDUCATION_LEVELS.map((level) => (
            <option key={level} value={level} className="bg-[#05070f]">
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
        {state.errors?.educationLevel && <p className={errorClass}>{state.errors.educationLevel}</p>}
      </div>
      <div>
        <label htmlFor="levelOrder" className={labelClass}>
          Position
        </label>
        <input id="levelOrder" name="levelOrder" type="number" min={1} required className={inputClass} placeholder="1" />
        {state.errors?.levelOrder && <p className={errorClass}>{state.errors.levelOrder}</p>}
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
          {pending ? "Adding…" : "Add class"}
        </button>
      </div>
    </form>
  );
}
