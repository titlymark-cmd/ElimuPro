"use client";

import { useTransition } from "react";

interface LearnerRow {
  id: string;
  name: string;
  admissionNumber: string;
  status: string | null;
}

const STATUSES = [
  { value: "present", label: "Present", color: "emerald" },
  { value: "late", label: "Late", color: "amber" },
  { value: "excused", label: "Excused", color: "sky" },
  { value: "absent", label: "Absent", color: "rose" },
] as const;

const COLOR_CLASSES: Record<string, string> = {
  emerald: "border-emerald-400/60 bg-emerald-400/20 text-emerald-300",
  amber: "border-amber-400/60 bg-amber-400/20 text-amber-300",
  sky: "border-sky-400/60 bg-sky-400/20 text-sky-300",
  rose: "border-rose-400/60 bg-rose-400/20 text-rose-300",
};

export function AttendanceGrid({
  learners,
  action,
}: {
  learners: LearnerRow[];
  action: (learnerId: string, status: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
          <tr>
            <th className="px-6 py-3 font-medium">Adm. No.</th>
            <th className="px-6 py-3 font-medium">Learner</th>
            <th className="px-6 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {learners.map((l) => (
            <tr key={l.id}>
              <td className="px-6 py-3 font-mono text-xs text-white/60">{l.admissionNumber}</td>
              <td className="px-6 py-3">{l.name}</td>
              <td className="px-6 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      disabled={pending}
                      onClick={() => startTransition(() => action(l.id, s.value))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        l.status === s.value ? COLOR_CLASSES[s.color] : "border-white/10 text-white/50 hover:border-white/30"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
