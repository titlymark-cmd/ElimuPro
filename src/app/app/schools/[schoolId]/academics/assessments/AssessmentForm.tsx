"use client";

import { useActionState, useState } from "react";
import type { AssessmentFormState } from "../actions";

const initialState: AssessmentFormState = {};

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-sky-400/50 focus:bg-white/[0.06]";
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-white/50";
const errorClass = "mt-1.5 text-xs font-medium text-rose-400";

interface ClassOption {
  id: string;
  name: string;
}
interface SubjectOption {
  id: string;
  name: string;
  classIds: string[];
}
interface TermOption {
  id: string;
  label: string;
}

type BoundAction = (state: AssessmentFormState, formData: FormData) => Promise<AssessmentFormState>;

export function AssessmentForm({
  action,
  classes,
  subjects,
  terms,
}: {
  action: BoundAction;
  classes: ClassOption[];
  subjects: SubjectOption[];
  terms: TermOption[];
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [classId, setClassId] = useState("");
  const availableSubjects = subjects.filter((s) => s.classIds.includes(classId));

  return (
    <form
      action={formAction}
      className="grid grid-cols-1 gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:grid-cols-2"
    >
      <div>
        <label htmlFor="asmtName" className={labelClass}>
          Assessment name
        </label>
        <input id="asmtName" name="name" required className={inputClass} placeholder="e.g. Mid-Term CAT" />
        {state.errors?.name && <p className={errorClass}>{state.errors.name}</p>}
      </div>
      <div>
        <label htmlFor="maxScore" className={labelClass}>
          Max score
        </label>
        <input id="maxScore" name="maxScore" type="number" min="0" step="0.01" required className={inputClass} placeholder="100" />
        {state.errors?.maxScore && <p className={errorClass}>{state.errors.maxScore}</p>}
      </div>
      <div>
        <label htmlFor="asmtClassId" className={labelClass}>
          Class
        </label>
        <select
          id="asmtClassId"
          name="classId"
          required
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#05070f]">
              {c.name}
            </option>
          ))}
        </select>
        {state.errors?.classId && <p className={errorClass}>{state.errors.classId}</p>}
      </div>
      <div>
        <label htmlFor="asmtSubjectId" className={labelClass}>
          Subject
        </label>
        <select id="asmtSubjectId" name="subjectId" required defaultValue="" disabled={!classId} className={inputClass}>
          <option value="" disabled>
            {classId ? "Select" : "Choose a class first"}
          </option>
          {availableSubjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#05070f]">
              {s.name}
            </option>
          ))}
        </select>
        {state.errors?.subjectId && <p className={errorClass}>{state.errors.subjectId}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="asmtTermId" className={labelClass}>
          Term
        </label>
        <select id="asmtTermId" name="termId" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Select
          </option>
          {terms.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#05070f]">
              {t.label}
            </option>
          ))}
        </select>
        {state.errors?.termId && <p className={errorClass}>{state.errors.termId}</p>}
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
          {pending ? "Creating…" : "Create assessment"}
        </button>
      </div>
    </form>
  );
}
