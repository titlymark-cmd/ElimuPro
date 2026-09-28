"use client";

import { useActionState, useState } from "react";
import type { InviteFormState } from "./actions";
import { STAFF_ROLES } from "@/lib/validation/staff";

const initialState: InviteFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

const ROLE_LABELS: Record<(typeof STAFF_ROLES)[number], string> = {
  school_admin: "School Admin",
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  bursar: "Bursar",
  teacher: "Teacher",
};

type BoundAction = (state: InviteFormState, formData: FormData) => Promise<InviteFormState>;

export function InviteForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8">
      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
        <div className="sm:col-span-2">
          <label htmlFor="inviteEmail" className={labelClass}>
            Email
          </label>
          <input id="inviteEmail" name="email" type="email" required className={inputClass} placeholder="teacher@school.ac.ke" />
          {state.errors?.email && <p className={errorClass}>{state.errors.email}</p>}
        </div>
        <div>
          <label htmlFor="inviteRole" className={labelClass}>
            Role
          </label>
          <select id="inviteRole" name="role" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Select
            </option>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role} className="bg-[#05070f]">
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {state.errors?.role && <p className={errorClass}>{state.errors.role}</p>}
        </div>
        <div className="sm:col-span-3">
          {state.message && (
            <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Creating invite…" : "Create invite link"}
          </button>
        </div>
      </form>

      {state.inviteLink && (
        <div className="mt-6 rounded-2xl border border-sky-400/30 bg-sky-400/5 p-4">
          <p className="text-xs font-medium text-sky-300">
            Invite created. Email delivery isn&apos;t set up yet — copy this link and send it to them yourself.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={state.inviteLink} className={`${inputClass} text-xs`} onFocus={(e) => e.currentTarget.select()} />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(state.inviteLink!);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="shrink-0 rounded-full border border-white/15 px-4 py-3 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
