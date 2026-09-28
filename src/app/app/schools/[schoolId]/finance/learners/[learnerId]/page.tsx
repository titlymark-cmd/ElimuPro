import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { recordPaymentAction, reversePaymentAction } from "../../actions";
import { PaymentForm } from "./PaymentForm";
import { ReverseButton } from "./ReverseButton";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  mpesa_manual: "M-Pesa (manual)",
  cheque: "Cheque",
  other: "Other",
};

export default async function LearnerFinancePage({ params }: { params: Promise<{ schoolId: string; learnerId: string }> }) {
  const { schoolId, learnerId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin", "bursar"]);

  const admin = supabaseAdmin();
  const { data: learner } = await admin
    .from("learners")
    .select("id, admission_number, first_name, last_name, class_id, classes(name)")
    .eq("id", learnerId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!learner) notFound();

  const { data: currentTerm } = await admin
    .from("terms")
    .select("id, name, academic_years(name)")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  const [{ data: feeItems }, { data: payments }, { data: terms }] = await Promise.all([
    currentTerm
      ? admin
          .from("fee_structure_items")
          .select("id, name, amount, class_id")
          .eq("school_id", schoolId)
          .eq("term_id", currentTerm.id)
          .or(`class_id.eq.${learner.class_id ?? "00000000-0000-0000-0000-000000000000"},class_id.is.null`)
      : Promise.resolve({ data: [] as { id: string; name: string; amount: number; class_id: string | null }[] }),
    admin
      .from("payments")
      .select("id, amount, method, reference, received_at, reversal_of_payment_id, terms(name)")
      .eq("school_id", schoolId)
      .eq("learner_id", learnerId)
      .order("received_at", { ascending: false }),
    admin
      .from("terms")
      .select("id, name, academic_years(name)")
      .eq("school_id", schoolId)
      .order("start_date", { ascending: false }),
  ]);

  const totalCharges = (feeItems ?? []).reduce((sum, item) => sum + Number(item.amount), 0);
  const totalPaid = (payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalCharges - totalPaid;

  const termOptions = (terms ?? []).map((t) => {
    const year = Array.isArray(t.academic_years) ? t.academic_years[0] : t.academic_years;
    return { id: t.id, label: `${t.name} (${year?.name ?? "—"})` };
  });

  const cls = Array.isArray(learner.classes) ? learner.classes[0] : learner.classes;
  const boundRecordPayment = recordPaymentAction.bind(null, schoolId, learnerId);

  return (
    <div className="space-y-10">
      <div>
        <Link href={`/app/schools/${schoolId}/finance`} className="text-xs font-medium text-white/40 hover:text-white/60">
          ← All statements
        </Link>
        <h2 className="mt-2 text-xl font-semibold">
          {learner.first_name} {learner.last_name}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          Adm. No. {learner.admission_number} · {cls?.name ?? "No class"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            Charged {currentTerm ? `(${currentTerm.name})` : "(no current term)"}
          </p>
          <p className="mt-2 text-2xl font-bold">KES {totalCharges.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">Total paid (all time)</p>
          <p className="mt-2 text-2xl font-bold">KES {totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
            {balance > 0 ? "Balance due" : balance < 0 ? "Credit" : "Balance"}
          </p>
          <p className={`mt-2 text-2xl font-bold ${balance > 0 ? "text-rose-300" : "text-emerald-300"}`}>
            KES {Math.abs(balance).toLocaleString()}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Payment history</h3>
        {!payments?.length ? (
          <p className="mt-3 text-sm text-white/50">No payments recorded yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Term</th>
                  <th className="px-6 py-3 font-medium">Reference</th>
                  <th className="px-6 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => {
                  const term = Array.isArray(p.terms) ? p.terms[0] : p.terms;
                  const isReversal = !!p.reversal_of_payment_id;
                  return (
                    <tr key={p.id} className={isReversal ? "text-white/50" : ""}>
                      <td className="px-6 py-4 text-xs">{new Date(p.received_at).toLocaleDateString()}</td>
                      <td className={`px-6 py-4 font-medium ${Number(p.amount) < 0 ? "text-rose-300" : "text-emerald-300"}`}>
                        {Number(p.amount) < 0 ? "-" : ""}KES {Math.abs(Number(p.amount)).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-white/60">{isReversal ? "Reversal" : METHOD_LABELS[p.method] ?? p.method}</td>
                      <td className="px-6 py-4 text-white/60">{term?.name ?? "—"}</td>
                      <td className="px-6 py-4 text-white/60">{p.reference ?? "—"}</td>
                      <td className="px-6 py-4 text-right">
                        {!isReversal && <ReverseButton action={reversePaymentAction.bind(null, schoolId, learnerId, p.id)} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold">Record payment</h3>
        <div className="mt-4">
          <PaymentForm action={boundRecordPayment} terms={termOptions} />
        </div>
      </div>
    </div>
  );
}
