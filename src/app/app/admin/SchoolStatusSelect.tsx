"use client";

import { useTransition } from "react";
import { SCHOOL_STATUSES } from "@/lib/validation/schools";

const STATUS_LABELS: Record<(typeof SCHOOL_STATUSES)[number], string> = {
  trial: "Trial",
  active: "Active",
  suspended: "Suspended",
};

export function SchoolStatusSelect({ current, action }: { current: string; action: (status: string) => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={current}
      disabled={pending}
      onChange={(e) => startTransition(() => action(e.target.value))}
      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-white outline-none transition focus:border-sky-400/50 disabled:opacity-60"
    >
      {SCHOOL_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-[#05070f]">
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
