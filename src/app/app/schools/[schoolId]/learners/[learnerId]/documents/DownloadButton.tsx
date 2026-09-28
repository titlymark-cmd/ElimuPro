"use client";

import { useTransition } from "react";
import type { DownloadLinkResult } from "./actions";

export function DownloadButton({ action }: { action: () => Promise<DownloadLinkResult> }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.url) {
            window.open(result.url, "_blank", "noopener,noreferrer");
          }
        })
      }
      className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-50"
    >
      {pending ? "Preparing…" : "Download"}
    </button>
  );
}
