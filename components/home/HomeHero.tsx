import { Plane } from "lucide-react";
import { HomeQuickAccessSelector } from "@/components/home/HomeQuickAccessSelector";

export function HomeHero() {
  return (
    <section className="relative isolate flex flex-col items-center justify-center overflow-hidden bg-[#06111F] px-6 py-7 sm:py-9 lg:py-10">
      <img
        src="/herohome.png"
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: "center 120%" }}
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.38)_55%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D6AE4F] sm:text-[12px]">
          TU RUTA. TU DECISIÓN. TU FUTURO.
        </p>

        <h1 className="mt-6 text-[2rem] font-semibold leading-[1.14] tracking-tight text-white sm:mt-7 sm:text-[2.5rem] md:text-[2.9rem] lg:text-[3.35rem] lg:leading-[1.08]">
          <span className="block lg:whitespace-nowrap">Planifica mejor. Elige mejor.</span>
          <span className="block text-[#D6AE4F] lg:whitespace-nowrap">Vuela más lejos.</span>
        </h1>

        <div className="mt-6 flex w-[210px] items-center justify-center gap-3 sm:mt-7 sm:w-[300px] lg:w-[380px]">
          <span
            className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D6AE4F]"
            aria-hidden
          />
          <Plane className="h-4 w-4 shrink-0 -rotate-45 text-white" aria-hidden />
          <span
            className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D6AE4F]"
            aria-hidden
          />
        </div>

        <p className="mt-6 max-w-[720px] text-[15px] leading-relaxed text-slate-100/90 sm:mt-7 sm:text-[16px] lg:text-[16.5px]">
          <span className="block lg:whitespace-nowrap">
            Recursos, herramientas y mentoría para construir tu ruta
          </span>
          <span className="block lg:whitespace-nowrap">
            como piloto con criterio y llegar más lejos.
          </span>
        </p>
      </div>

      <div className="relative z-[1] mx-auto mt-8 w-full max-w-5xl sm:mt-9">
        <HomeQuickAccessSelector />
      </div>
    </section>
  );
}
