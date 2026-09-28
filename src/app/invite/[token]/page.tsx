import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../../public/images/elimupro-logo.jpg";
import { hashToken } from "@/lib/auth/token";
import { supabaseAdmin } from "@/lib/supabase/server";
import { acceptInvitationAction } from "./actions";
import { AcceptInviteForm } from "./AcceptInviteForm";

export const metadata: Metadata = {
  title: "You're invited — ElimuPro",
};

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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 bg-[#05070f]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src={logo} alt="ElimuPro logo" width={40} height={40} className="rounded-md" priority />
            <span className="text-lg font-semibold tracking-tight">
              Elimu<span className="text-sky-400">Pro</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, rgba(56,132,255,0.18) 0%, rgba(5,7,15,0) 70%)" }}
        />
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-10">{children}</div>
      </main>
    </div>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = supabaseAdmin();

  const { data: invitation } = await admin
    .from("invitations")
    .select("email, role, expires_at, accepted_at, revoked_at, schools(name)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!invitation) {
    return (
      <Shell>
        <p className="text-sm text-white/70">This invite link is invalid.</p>
      </Shell>
    );
  }
  if (invitation.accepted_at) {
    return (
      <Shell>
        <p className="text-sm text-white/70">This invite has already been used.</p>
        <Link href="/login" className="mt-6 inline-block rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white">
          Go to login
        </Link>
      </Shell>
    );
  }
  if (invitation.revoked_at) {
    return (
      <Shell>
        <p className="text-sm text-white/70">This invite has been revoked by the school.</p>
      </Shell>
    );
  }
  if (new Date(invitation.expires_at) < new Date()) {
    return (
      <Shell>
        <p className="text-sm text-white/70">This invite has expired. Ask your school admin to send a new one.</p>
      </Shell>
    );
  }

  const { data: existingUser } = await admin.from("users").select("id").eq("email", invitation.email).maybeSingle();
  const isNewUser = !existingUser;
  const school = Array.isArray(invitation.schools) ? invitation.schools[0] : invitation.schools;
  const boundAction = acceptInvitationAction.bind(null, token);

  return (
    <Shell>
      <h1 className="text-2xl font-bold tracking-tight">You&apos;ve been invited</h1>
      <p className="mt-2 text-sm text-white/60">
        Join <span className="text-white">{school?.name}</span> as {isNewUser ? "a" : "an"}{" "}
        <span className="text-white">{ROLE_LABELS[invitation.role] ?? invitation.role}</span>.
      </p>
      <AcceptInviteForm action={boundAction} email={invitation.email} isNewUser={isNewUser} />
    </Shell>
  );
}
