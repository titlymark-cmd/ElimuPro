"use client";

import { useActionState } from "react";
import type { AcceptInviteFormState } from "./actions";

const initialState: AcceptInviteFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-2 text-xs font-medium text-rose-400";

type BoundAction = (state: AcceptInviteFormState, formData: FormData) => Promise<AcceptInviteFormState>;

export function AcceptInviteForm({ action, email, isNewUser }: { action: BoundAction; email: string; isNewUser: boolean }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <div>
        <label className={labelClass}>Email</label>
        <input value={email} disabled className={`${inputClass} opacity-60`} />
      </div>

      {isNewUser ? (
        <>
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Your full name
            </label>
            <input id="fullName" name="fullName" required className={inputClass} placeholder="Jane Wanjiru" />
            {state.errors?.fullName && <p className={errorClass}>{state.errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>
              Choose a password
            </label>
            <input id="password" name="password" type="password" required className={inputClass} placeholder="At least 8 characters" />
            {state.errors?.password && <p className={errorClass}>{state.errors.password}</p>}
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/60">
          You already have an ElimuPro account. Accepting will add this school to it — you&apos;ll then sign in as usual.
        </p>
      )}

      {state.message && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Please wait…" : isNewUser ? "Create account & join" : "Accept invite"}
      </button>
    </form>
  );
}
