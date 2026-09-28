"use client";

import { useTransition } from "react";

export function ClassSubjectToggle({ checked, action }: { checked: boolean; action: (enabled: boolean) => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={checked}
      disabled={pending}
      onChange={(e) => startTransition(() => action(e.target.checked))}
      className="h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-sky-500 disabled:opacity-50"
    />
  );
}
