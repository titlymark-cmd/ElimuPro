import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/images/elimupro-logo.jpg";
import { requireUser, getSchoolMemberships } from "@/lib/auth/dal";
import { logoutAction } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const memberships = await getSchoolMemberships(user.id);

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="flex flex-col border-b border-white/10 bg-white/[0.02] px-6 py-6 lg:min-h-full lg:w-64 lg:border-b-0 lg:border-r">
        <Link href="/" className="flex items-center gap-3">
          <Image src={logo} alt="ElimuPro logo" width={32} height={32} className="rounded-md" />
          <span className="text-base font-semibold tracking-tight">
            Elimu<span className="text-sky-400">Pro</span>
          </span>
        </Link>

        <nav className="mt-10 flex flex-1 flex-col gap-1 text-sm">
          <Link
            href="/app"
            className="rounded-xl px-3 py-2 font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
          >
            Dashboard
          </Link>
          {user.isPlatformAdmin && (
            <Link
              href="/app/admin"
              className="rounded-xl px-3 py-2 font-medium text-white/80 transition hover:bg-white/[0.06] hover:text-white"
            >
              Platform Admin
            </Link>
          )}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
          <p className="truncate text-xs text-white/50">{user.email}</p>
          <form action={logoutAction} className="mt-3">
            <button
              type="submit"
              className="w-full rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 px-6 py-10 sm:px-10">
        {memberships.length === 0 && !user.isPlatformAdmin ? (
          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-6 text-sm text-amber-200">
            Your account isn&apos;t linked to any school yet.
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
