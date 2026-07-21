import { GuideDigitalCheckoutButton } from "@/components/guia/GuideDigitalCheckoutButton";

export function GuiaCTABuyButton() {
  return <GuideDigitalCheckoutButton label="Comprar guía digital" className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#c9a454] bg-[#c9a454] px-8 py-3 text-[15px] font-semibold text-[#0f1a33] shadow-[0_14px_40px_rgba(201,164,84,0.35)] transition hover:bg-[#ddb75c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/50 disabled:cursor-wait disabled:opacity-70 sm:w-auto" />;
}
