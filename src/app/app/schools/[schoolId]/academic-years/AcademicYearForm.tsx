"use client";

import { useActionState } from "react";
import type { AcademicYearFormState } from "./actions";

const initialState: AcademicYearFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

function DateField({ id, label, error }: { id: string; label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} name={id} type="date" required className={inputClass} />
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

type BoundAction = (state: AcademicYearFormState, formData: FormData) => Promise<AcademicYearFormState>;

export function AcademicYearForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
      <div>
        <label htmlFor="name" className={labelClass}>
          Year name
        </label>
        <input id="name" name="name" required className={inputClass} placeholder="e.g. 2026" />
        {state.errors?.name && <p className={errorClass}>{state.errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField id="startDate" label="Academic year start" error={state.errors?.startDate} />
        <DateField id="endDate" label="Academic year end" error={state.errors?.endDate} />
      </div>

      {[1, 2, 3].map((n) => (
        <div key={n} className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 sm:grid-cols-2">
          <DateField
            id={`term${n}Start`}
            label={`Term ${n} start`}
            error={state.errors?.[`term${n}Start` as keyof typeof state.errors]}
          />
          <DateField
            id={`term${n}End`}
            label={`Term ${n} end`}
            error={state.errors?.[`term${n}End` as keyof typeof state.errors]}
          />
        </div>
      ))}

      {state.message && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create academic year"}
      </button>
    </form>
  );
}
