"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logo from "../../public/images/elimupro-logo.jpg";

const HOLD_MS = 2200;
const SHRINK_MS = 700;

export default function IntroLogo() {
  const [phase, setPhase] = useState<"hold" | "shrink" | "done">("hold");

  useEffect(() => {
    const shrinkTimer = setTimeout(() => setPhase("shrink"), HOLD_MS);
    const doneTimer = setTimeout(() => setPhase("done"), HOLD_MS + SHRINK_MS);
    return () => {
      clearTimeout(shrinkTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "done") return null;

  const shrinking = phase === "shrink";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#05070f] transition-opacity ease-in-out ${
        shrinking ? "opacity-0" : "opacity-100"
      }`}
      style={{ transitionDuration: `${SHRINK_MS}ms` }}
      aria-hidden="true"
    >
      <div
        className={`relative overflow-hidden rounded-[32px] border border-white/20 bg-white/5 p-4 shadow-[0_0_90px_-15px_rgba(56,132,255,0.85)] backdrop-blur-xl transition-transform ease-in-out sm:p-5 ${
          shrinking ? "scale-[0.32]" : "scale-100"
        }`}
        style={{ transitionDuration: `${SHRINK_MS}ms` }}
      >
        <Image
          src={logo}
          alt="ElimuPro logo"
          width={200}
          height={200}
          className="relative rounded-2xl"
          priority
        />
      </div>
    </div>
  );
}
