"use client";

import { useActionState } from "react";
import type { AnnouncementFormState } from "./actions";
import { ANNOUNCEMENT_ROLES } from "@/lib/validation/announcements";

const initialState: AnnouncementFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

const ROLE_LABELS: Record<(typeof ANNOUNCEMENT_ROLES)[number], string> = {
  school_owner: "School Owner",
  school_admin: "School Admin",
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  bursar: "Bursar",
  teacher: "Teacher",
  parent: "Parent",
  learner: "Learner",
};

type BoundAction = (state: AnnouncementFormState, formData: FormData) => Promise<AnnouncementFormState>;

export function AnnouncementForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <div>
        <label htmlFor="annTitle" className={labelClass}>
          Title
        </label>
        <input id="annTitle" name="title" required className={inputClass} placeholder="e.g. Term 2 opens Monday" />
        {state.errors?.title && <p className={errorClass}>{state.errors.title}</p>}
      </div>
      <div>
        <label htmlFor="annBody" className={labelClass}>
          Message
        </label>
        <textarea id="annBody" name="body" required rows={3} className={inputClass} placeholder="Details..." />
        {state.errors?.body && <p className={errorClass}>{state.errors.body}</p>}
      </div>
      <div>
        <label htmlFor="targetRole" className={labelClass}>
          Audience
        </label>
        <select id="targetRole" name="targetRole" defaultValue="" className={inputClass}>
          <option value="" className="bg-[#05070f]">
            Everyone at the school
          </option>
          {ANNOUNCEMENT_ROLES.map((r) => (
            <option key={r} value={r} className="bg-[#05070f]">
              {ROLE_LABELS[r]} only
            </option>
          ))}
        </select>
      </div>

      {state.message && (
        <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Posting…" : "Post announcement"}
      </button>
    </form>
  );
}
