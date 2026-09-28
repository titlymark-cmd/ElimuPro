"use client";

import { useActionState } from "react";
import { signupAction, type SignupFormState } from "./actions";

const initialState: SignupFormState = {};

const categories = [
  { value: "day", label: "Day school" },
  { value: "boarding", label: "Boarding school" },
  { value: "mixed", label: "Day & boarding" },
];

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-2 text-xs font-medium text-rose-400";

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="schoolName" className={labelClass}>
          School name
        </label>
        <input id="schoolName" name="schoolName" required className={inputClass} placeholder="e.g. Green Hills Academy" />
        {state.errors?.schoolName && <p className={errorClass}>{state.errors.schoolName}</p>}
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>
          School type
        </label>
        <select id="category" name="category" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select one
          </option>
          {categories.map((c) => (
            <option key={c.value} value={c.value} className="bg-[#05070f]">
              {c.label}
            </option>
          ))}
        </select>
        {state.errors?.category && <p className={errorClass}>{state.errors.category}</p>}
      </div>

      <div>
        <label htmlFor="fullName" className={labelClass}>
          Your full name
        </label>
        <input id="fullName" name="fullName" required className={inputClass} placeholder="Jane Wanjiru" />
        {state.errors?.fullName && <p className={errorClass}>{state.errors.fullName}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Work email
        </label>
        <input id="email" name="email" type="email" required className={inputClass} placeholder="you@school.ac.ke" />
        {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input id="password" name="password" type="password" required className={inputClass} placeholder="At least 8 characters" />
        {state.errors?.password && <p className={errorClass}>{state.errors.password}</p>}
      </div>

      {state.message && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creating your school…" : "Create school account"}
      </button>
    </form>
  );
}
