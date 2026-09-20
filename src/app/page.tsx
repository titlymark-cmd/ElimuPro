import Image from "next/image";
import logo from "../../public/images/elimupro-logo.jpg";

const pillars = [
  {
    title: "Admission",
    description:
      "Streamline enrollment with online applications, document uploads, and real-time status tracking for every student.",
    icon: "🎓",
  },
  {
    title: "Fees",
    description:
      "Manage invoices, payments, and balances with clear statements for parents and automated reminders for the school.",
    icon: "💳",
  },
  {
    title: "Performance",
    description:
      "Track grades, attendance, and progress reports so teachers and parents always know where each student stands.",
    icon: "📈",
  },
  {
    title: "Future",
    description:
      "Guide students toward the next step with career insights, transcripts, and personalized academic pathways.",
    icon: "🚀",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Image
            src={logo}
            alt="ElimuPro logo"
            width={40}
            height={40}
            className="rounded-md"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">
            Elimu<span className="text-sky-400">Pro</span>
          </span>
        </div>
        <a
          href="#get-started"
          className="rounded-full border border-sky-400/40 px-5 py-2 text-sm font-medium text-sky-300 transition hover:border-sky-300 hover:bg-sky-400/10"
        >
          Get Started
        </a>
      </header>

      <main className="flex-1">
        <section className="relative min-h-[560px] overflow-hidden sm:min-h-[680px]">
          <video
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          >
            <source src="/videos/hero-graduates.webm" type="video/webm" />
            <source src="/videos/hero-graduates.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 -z-10 bg-[#05070f]/70" />
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(56,132,255,0.25) 0%, rgba(5,7,15,0) 70%)",
            }}
          />
          <div className="relative mx-auto flex h-full min-h-[560px] max-w-4xl flex-col items-center justify-center px-6 py-20 text-center sm:min-h-[680px] sm:py-28">
            <Image
              src={logo}
              alt="ElimuPro logo"
              width={120}
              height={120}
              className="mb-8 rounded-2xl shadow-[0_0_60px_-10px_rgba(56,132,255,0.6)]"
              priority
            />
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Every student journey,
              <span className="block text-sky-400">managed in one place</span>
            </h1>
            <p className="mt-6 max-w-2xl text-balance text-base text-white/70 sm:text-lg">
              ElimuPro brings admission, fees, performance, and future
              planning together — giving schools, parents, and students a
              single, reliable source of truth.
            </p>
            <div
              id="get-started"
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <a
                href="mailto:hello@elimupro.app"
                className="rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
              >
                Request a Demo
              </a>
              <a
                href="#pillars"
                className="rounded-full border border-white/15 px-8 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Explore Features
              </a>
            </div>
          </div>
        </section>

        <section id="pillars" className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built around what matters most
            </h2>
            <p className="mt-4 text-white/60">
              Four pillars keep schools organized and families informed, from
              the first application to graduation and beyond.
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-sky-400/40 hover:bg-white/[0.05]"
              >
                <div className="text-3xl">{pillar.icon}</div>
                <h3 className="mt-4 text-lg font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-transparent p-10 text-center sm:p-16">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to bring your school onto ElimuPro?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/60">
              Join schools using ElimuPro to simplify admissions, collect fees
              on time, and keep every student on track for their future.
            </p>
            <a
              href="mailto:hello@elimupro.app"
              className="mt-8 inline-block rounded-full bg-sky-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Talk to Us
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-white/40 sm:flex-row">
          <span>© {new Date().getFullYear()} ElimuPro. All rights reserved.</span>
          <span>Admission · Fees · Performance · Future</span>
        </div>
      </footer>
    </div>
  );
}
