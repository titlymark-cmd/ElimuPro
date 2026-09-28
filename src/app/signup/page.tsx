import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import logo from "../../../public/images/elimupro-logo.jpg";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your school account — ElimuPro",
};

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 bg-[#05070f]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src={logo} alt="ElimuPro logo" width={40} height={40} className="rounded-md" priority />
            <span className="text-lg font-semibold tracking-tight">
              Elimu<span className="text-sky-400">Pro</span>
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Sign in instead
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background: "radial-gradient(60% 50% at 50% 0%, rgba(56,132,255,0.18) 0%, rgba(5,7,15,0) 70%)",
          }}
        />
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl sm:p-10">
          <h1 className="text-2xl font-bold tracking-tight">Bring your school onto ElimuPro</h1>
          <p className="mt-2 text-sm text-white/60">
            Create your school&apos;s account — you&apos;ll be its owner and can invite staff afterwards.
          </p>
          <div className="mt-8">
            <SignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}
