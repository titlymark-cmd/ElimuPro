"use client";

import { useState, useTransition } from "react";

interface LearnerRow {
  id: string;
  name: string;
  admissionNumber: string;
  score: number | null;
}

export function MarksGrid({
  learners,
  maxScore,
  action,
}: {
  learners: LearnerRow[];
  maxScore: number;
  action: (learnerId: string, score: number) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(learners.map((l) => [l.id, l.score !== null ? String(l.score) : ""]))
  );
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  function handleBlur(learnerId: string) {
    const raw = values[learnerId];
    if (raw === "") return;
    const score = Number(raw);
    if (Number.isNaN(score) || score < 0 || score > maxScore) return;

    startTransition(async () => {
      await action(learnerId, score);
      setSavedIds((prev) => new Set(prev).add(learnerId));
      setTimeout(() => setSavedIds((prev) => { const next = new Set(prev); next.delete(learnerId); return next; }), 1500);
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
          <tr>
            <th className="px-6 py-3 font-medium">Adm. No.</th>
            <th className="px-6 py-3 font-medium">Learner</th>
            <th className="px-6 py-3 font-medium">Score (out of {maxScore})</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {learners.map((l) => (
            <tr key={l.id}>
              <td className="px-6 py-3 font-mono text-xs text-white/60">{l.admissionNumber}</td>
              <td className="px-6 py-3">{l.name}</td>
              <td className="px-6 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={maxScore}
                    step="0.01"
                    disabled={pending}
                    value={values[l.id] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [l.id]: e.target.value }))}
                    onBlur={() => handleBlur(l.id)}
                    className="w-24 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-sky-400/50 disabled:opacity-60"
                  />
                  {savedIds.has(l.id) && <span className="text-xs text-emerald-300">Saved</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
