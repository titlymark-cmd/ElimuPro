"use client";

import { useActionState, useRef } from "react";
import type { UploadDocumentState } from "./actions";

const initialState: UploadDocumentState = {};

type BoundAction = (state: UploadDocumentState, formData: FormData) => Promise<UploadDocumentState>;

export function DocumentUploadForm({ action }: { action: BoundAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <input
        name="file"
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        required
        className="text-xs text-white/70 file:mr-3 file:rounded-full file:border file:border-white/15 file:bg-white/[0.04] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white/80 file:transition hover:file:border-white/30"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sky-500 px-6 py-2 text-xs font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {state.message && <span className="text-xs text-rose-400">{state.message}</span>}
    </form>
  );
}
