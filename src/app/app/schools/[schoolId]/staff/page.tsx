import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createInvitationAction, revokeInvitationAction } from "./actions";
import { InviteForm } from "./InviteForm";
import { RevokeButton } from "./RevokeButton";

const ROLE_LABELS: Record<string, string> = {
  school_owner: "School Owner",
  school_admin: "School Admin",
  headteacher: "Headteacher",
  deputy_headteacher: "Deputy Headteacher",
  bursar: "Bursar",
  teacher: "Teacher",
  parent: "Parent",
  learner: "Learner",
};

export default async function StaffPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  await requireSchoolMembership(schoolId, ["school_owner", "school_admin"]);

  const admin = supabaseAdmin();
  const [{ data: memberships }, { data: invitations }] = await Promise.all([
    admin
      .from("school_memberships")
      .select("id, role, joined_at, users(full_name, email)")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("joined_at", { ascending: true }),
    admin
      .from("invitations")
      .select("id, email, role, created_at, expires_at")
      .eq("school_id", schoolId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const boundInvite = createInvitationAction.bind(null, schoolId);

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold">Staff</h2>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {memberships?.map((m) => {
                const memberUser = Array.isArray(m.users) ? m.users[0] : m.users;
                return (
                  <tr key={m.id}>
                    <td className="px-6 py-4">{memberUser?.full_name}</td>
                    <td className="px-6 py-4 text-white/60">{memberUser?.email}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                        {ROLE_LABELS[m.role] ?? m.role}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {!!invitations?.length && (
        <div>
          <h2 className="text-lg font-semibold">Pending invites</h2>
          <div className="mt-4 space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-3"
              >
                <div>
                  <p className="text-sm text-white/80">{inv.email}</p>
                  <p className="text-xs text-white/40">
                    {ROLE_LABELS[inv.role] ?? inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <RevokeButton action={revokeInvitationAction.bind(null, schoolId, inv.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold">Invite staff</h2>
        <div className="mt-4">
          <InviteForm action={boundInvite} />
        </div>
      </div>
    </div>
  );
}
