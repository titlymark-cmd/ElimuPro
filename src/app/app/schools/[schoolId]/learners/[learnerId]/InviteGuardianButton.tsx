"use client";

import { useState, useTransition } from "react";
import type { InviteGuardianResult } from "../actions";

export function InviteGuardianButton({ action }: { action: () => Promise<InviteGuardianResult> }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<InviteGuardianResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (result?.inviteLink) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <input
          readOnly
          value={result.inviteLink}
          onFocus={(e) => e.currentTarget.select()}
          className="w-56 rounded-full border border-sky-400/30 bg-sky-400/5 px-3 py-1.5 text-xs text-sky-200 outline-none"
        />
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(result.inviteLink!);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => setResult(await action()))}
        className="rounded-full border border-sky-400/40 px-3 py-1 text-xs font-medium text-sky-300 transition hover:border-sky-300 hover:bg-sky-400/10 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Invite to portal"}
      </button>
      {result?.message && <p className="mt-1 text-xs text-rose-400">{result.message}</p>}
    </div>
  );
}
