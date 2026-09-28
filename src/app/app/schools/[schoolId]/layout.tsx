import Link from "next/link";
import { requireSchoolMembership } from "@/lib/auth/dal";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function SchoolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  // Every read/write below the school-scoped routes hangs off this one
  // check — schoolId comes from the URL, but access is only granted if
  // the caller's own verified session has a membership row for it.
  const { membership } = await requireSchoolMembership(schoolId);

  const { data: school } = await supabaseAdmin().from("schools").select("id, name").eq("id", schoolId).maybeSingle();
  if (!school) notFound();

  const canManage = ["school_owner", "school_admin", "headteacher"].includes(membership.role);
  const canManageStaff = ["school_owner", "school_admin"].includes(membership.role);
  const canManageFinance = ["school_owner", "school_admin", "bursar"].includes(membership.role);
  const canAccessAcademics = ["school_owner", "school_admin", "headteacher", "teacher"].includes(membership.role);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <Link href="/app" className="text-xs font-medium text-white/40 hover:text-white/60">
            ← All schools
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{school.name}</h1>
        </div>
        <nav className="flex gap-2 text-sm">
          <Link
            href={`/app/schools/${schoolId}`}
            className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Overview
          </Link>
          {canManage && (
            <>
              <Link
                href={`/app/schools/${schoolId}/academic-years`}
                className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Academic Years
              </Link>
              <Link
                href={`/app/schools/${schoolId}/classes`}
                className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Classes
              </Link>
              <Link
                href={`/app/schools/${schoolId}/learners`}
                className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Learners
              </Link>
            </>
          )}
          {canAccessAcademics && (
            <Link
              href={`/app/schools/${schoolId}/academics`}
              className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Academics
            </Link>
          )}
          {canManageFinance && (
            <Link
              href={`/app/schools/${schoolId}/finance`}
              className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Finance
            </Link>
          )}
          {canManageStaff && (
            <Link
              href={`/app/schools/${schoolId}/staff`}
              className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Staff
            </Link>
          )}
          <Link
            href={`/app/schools/${schoolId}/announcements`}
            className="rounded-full border border-white/10 px-4 py-2 font-medium text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Announcements
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}
