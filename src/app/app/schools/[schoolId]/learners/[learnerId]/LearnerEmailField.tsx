"use client";

import { useActionState } from "react";
import type { LearnerEmailFormState } from "../actions";

const initialState: LearnerEmailFormState = {};

type BoundAction = (state: LearnerEmailFormState, formData: FormData) => Promise<LearnerEmailFormState>;

export function LearnerEmailField({ action, currentEmail }: { action: BoundAction; currentEmail: string | null }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        name="email"
        type="email"
        defaultValue={currentEmail ?? ""}
        placeholder="learner@example.com (optional)"
        className="w-56 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save"}
      </button>
      {state.errors?.email && <span className="text-xs text-rose-400">{state.errors.email}</span>}
      {state.message && <span className="text-xs text-rose-400">{state.message}</span>}
    </form>
  );
}
