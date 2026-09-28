import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import logo from "../../../public/images/elimupro-logo.jpg";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — ElimuPro",
};

export default function LoginPage() {
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
            href="/signup"
            className="rounded-full border border-sky-400/40 px-5 py-2 text-sm font-medium text-sky-300 transition hover:border-sky-300 hover:bg-sky-400/10"
          >
            Create a school account
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-white/60">Sign in to your ElimuPro account.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
