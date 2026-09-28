"use client";

import { useTransition } from "react";
import { LEARNER_STATUSES } from "@/lib/validation/learners";

const STATUS_LABELS: Record<(typeof LEARNER_STATUSES)[number], string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  transferred: "Transferred",
};

export function StatusSelect({ current, action }: { current: string; action: (status: string) => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => startTransition(() => action(e.target.value))}
      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white outline-none transition focus:border-sky-400/50 disabled:opacity-60"
    >
      {LEARNER_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-[#05070f]">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
