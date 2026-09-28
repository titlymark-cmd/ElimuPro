"use client";

import { useTransition } from "react";

export function ReverseButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Reverse this payment? This adds an offsetting entry — the original record is never deleted.")) {
          startTransition(() => action());
        }
      }}
      className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/50 transition hover:border-rose-400/40 hover:text-rose-300 disabled:opacity-50"
    >
      {pending ? "Reversing…" : "Reverse"}
    </button>
  );
}
