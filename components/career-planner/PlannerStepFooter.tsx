import { ArrowRight } from "lucide-react";

type PlannerStepFooterProps = {
  label: string;
  onClick: () => void;
  variant?: "gold" | "outline";
  disabled?: boolean;
};

export function PlannerStepFooter({
  label,
  onClick,
  variant = "gold",
  disabled = false,
}: PlannerStepFooterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[15px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6AE4F]/45 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
        variant === "gold"
          ? "bg-[#D6AE4F] text-[#101B35] hover:brightness-105"
          : "border border-white/20 text-white hover:border-[#D6AE4F]/50 hover:text-[#E8C978]"
      }`}
    >
      {label}
      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
    </button>
  );
}
