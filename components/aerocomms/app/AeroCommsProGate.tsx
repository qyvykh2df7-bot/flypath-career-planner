import Link from "next/link";
import { LockKeyhole } from "lucide-react";

type AeroCommsProGateProps = {
  title?: string;
  description?: string;
  compact?: boolean;
};

export function AeroCommsProLockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <LockKeyhole aria-hidden="true" className={className} />;
}

export function AeroCommsProGate({
  title = "Contenido de AeroComms Pro",
  description = "Desbloquea todo Cadet, los niveles avanzados y todas las misiones.",
  compact = false,
}: AeroCommsProGateProps) {
  return (
    <section
      aria-label="Contenido bloqueado de AeroComms Pro"
      className={`rounded-2xl border border-[#FACC15]/25 bg-[#FACC15]/[0.07] text-center ${compact ? "p-4" : "p-6"}`}
    >
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FACC15]/15 text-[#FACC15]">
        <AeroCommsProLockIcon />
      </span>
      <h2 className={`${compact ? "mt-3 text-base" : "mt-4 text-lg"} font-bold text-white`}>{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-300">{description}</p>
      <Link href="/aerocomms/app/paywall" className="primary-btn mt-4 inline-flex w-full items-center justify-center sm:w-auto">
        Desbloquear AeroComms Pro
      </Link>
    </section>
  );
}
