"use client";

import { useActionState, useState } from "react";
import type { LearnerFormState } from "./actions";

const initialState: LearnerFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

interface ClassOption {
  id: string;
  name: string;
  streams: { id: string; name: string }[];
}

type BoundAction = (state: LearnerFormState, formData: FormData) => Promise<LearnerFormState>;

export function LearnerForm({ action, classes }: { action: BoundAction; classes: ClassOption[] }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [selectedClassId, setSelectedClassId] = useState("");
  const streams = classes.find((c) => c.id === selectedClassId)?.streams ?? [];

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-2"
    >
      <div>
        <label htmlFor="firstName" className={labelClass}>
          First name
        </label>
        <input id="firstName" name="firstName" required className={inputClass} />
        {state.errors?.firstName && <p className={errorClass}>{state.errors.firstName}</p>}
      </div>
      <div>
        <label htmlFor="lastName" className={labelClass}>
          Last name
        </label>
        <input id="lastName" name="lastName" required className={inputClass} />
        {state.errors?.lastName && <p className={errorClass}>{state.errors.lastName}</p>}
      </div>
      <div>
        <label htmlFor="dateOfBirth" className={labelClass}>
          Date of birth
        </label>
        <input id="dateOfBirth" name="dateOfBirth" type="date" className={inputClass} />
        {state.errors?.dateOfBirth && <p className={errorClass}>{state.errors.dateOfBirth}</p>}
      </div>
      <div>
        <label htmlFor="gender" className={labelClass}>
          Gender
        </label>
        <select id="gender" name="gender" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select
          </option>
          <option value="male" className="bg-[#05070f]">
            Male
          </option>
          <option value="female" className="bg-[#05070f]">
            Female
          </option>
        </select>
        {state.errors?.gender && <p className={errorClass}>{state.errors.gender}</p>}
      </div>
      <div>
        <label htmlFor="classId" className={labelClass}>
          Class
        </label>
        <select
          id="classId"
          name="classId"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className={inputClass}
        >
          <option value="" className="bg-[#05070f]">
            Not assigned
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#05070f]">
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="streamId" className={labelClass}>
          Stream
        </label>
        <select id="streamId" name="streamId" disabled={!streams.length} className={inputClass}>
          <option value="" className="bg-[#05070f]">
            Not assigned
          </option>
          {streams.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#05070f]">
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        {state.message && (
          <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">{state.message}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Enrolling…" : "Enroll learner"}
        </button>
      </div>
    </form>
  );
}
