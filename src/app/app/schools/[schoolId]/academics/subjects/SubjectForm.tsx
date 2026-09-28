"use client";

import { useActionState } from "react";
import type { SubjectFormState } from "../actions";

const initialState: SubjectFormState = {};

type BoundAction = (state: SubjectFormState, formData: FormData) => Promise<SubjectFormState>;

export function SubjectForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <div className="flex-1">
        <label htmlFor="subjectName" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50">
          Subject name
        </label>
        <input
          id="subjectName"
          name="name"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]"
          placeholder="e.g. Mathematics"
        />
        {state.errors?.name && <p className="mt-1.5 text-xs font-medium text-rose-400">{state.errors.name}</p>}
        {state.message && <p className="mt-1.5 text-xs font-medium text-rose-400">{state.message}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add subject"}
      </button>
    </form>
  );
}
