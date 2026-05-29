import Link from "next/link";
import {
  FREE_REPORT_NAVY_DIVIDER,
  FREE_REPORT_VALIDATION_BODY,
  FREE_REPORT_VALIDATION_BULLETS,
  FREE_REPORT_VALIDATION_LEAD,
  FREE_REPORT_VALIDATION_TITLE,
} from "@/lib/free-report-data";
import {
  PREMIUM_REPORT_CHECKOUT_CTA_LABEL,
  PREMIUM_REPORT_CHECKOUT_URL,
} from "@/lib/premium-report-checkout";

function ColumnDivider() {
  return (
    <div
      className="my-6 w-px shrink-0 self-stretch"
      style={{ backgroundColor: FREE_REPORT_NAVY_DIVIDER }}
      aria-hidden
    />
  );
}

function PremiumGoldCheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      width="16"
      height="16"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 6.2 L4.6 8.8 L10 3.2"
        stroke="#c9a454"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PremiumChecklistItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3.5">
      <PremiumGoldCheckIcon />
      <span className="text-[13px] leading-snug text-[#faf8f4]/92">{label}</span>
    </li>
  );
}

/** Bloque navy editorial — 3 columnas (preview página 2). */
export function FreeReportValidationBlock() {
  return (
    <div className="mt-2 flex bg-[#0f1a33]">
      <div className="min-w-0 flex-[1.05] px-7 py-7 sm:px-8">
        <h3 className="font-serif text-[1.2rem] font-medium leading-snug text-[#faf8f4]">
          {FREE_REPORT_VALIDATION_TITLE}
        </h3>
        <p className="mt-3.5 text-[13px] leading-relaxed text-[#faf8f4]/72">{FREE_REPORT_VALIDATION_LEAD}</p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#faf8f4]/72">{FREE_REPORT_VALIDATION_BODY}</p>
      </div>

      <ColumnDivider />

      <div className="min-w-0 flex-[1.15] px-7 py-7 sm:px-8">
        <ul className="space-y-4 pt-0.5" role="list">
          {FREE_REPORT_VALIDATION_BULLETS.map((item) => (
            <PremiumChecklistItem key={item} label={item} />
          ))}
        </ul>
      </div>

      <ColumnDivider />

      <div className="flex w-[12.75rem] shrink-0 flex-col items-center justify-center px-5 py-7 sm:w-[13.25rem] sm:px-6">
        <Link
          href={PREMIUM_REPORT_CHECKOUT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] w-full min-w-[11.5rem] items-center justify-center rounded-sm bg-[#c9a454] px-7 py-2.5 text-center text-sm font-semibold leading-tight text-[#0f1a33] shadow-[0_2px_12px_rgba(201,164,84,0.35)] transition-opacity hover:opacity-95"
        >
          {PREMIUM_REPORT_CHECKOUT_CTA_LABEL}
        </Link>
        <p className="mt-6 text-center text-xs leading-relaxed text-[#faf8f4]/60">
          También puedes{" "}
          <Link
            href="/mentorias"
            className="font-semibold text-[#c9a454] underline decoration-[#c9a454]/45 underline-offset-2 hover:decoration-[#c9a454]"
          >
            reservar una mentoría FlyPath
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
