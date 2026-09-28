"use client";

import { useActionState } from "react";
import type { StreamFormState } from "./actions";

const initialState: StreamFormState = {};

type BoundAction = (state: StreamFormState, formData: FormData) => Promise<StreamFormState>;

export function StreamForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div>
        <input
          name="name"
          required
          placeholder="Stream name, e.g. Blue"
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50"
        />
        {state.errors?.name && <p className="mt-1 text-xs font-medium text-rose-400">{state.errors.name}</p>}
        {state.message && <p className="mt-1 text-xs font-medium text-rose-400">{state.message}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-sky-400/40 px-4 py-2 text-xs font-semibold text-sky-300 transition hover:border-sky-300 hover:bg-sky-400/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Adding…" : "+ Stream"}
      </button>
    </form>
  );
}
