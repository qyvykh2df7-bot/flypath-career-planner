type PlannerOnboardingStepProps = {
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** Shown above the primary button when next is disabled */
  nextDisabledHint?: string;
};

export function PlannerOnboardingStep({
  step,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Siguiente",
  nextDisabled = false,
  nextDisabledHint,
}: PlannerOnboardingStepProps) {
  return (
    <div className="mx-auto w-full max-w-lg">
      <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#c9a454]">
        Configuración · paso {step} de {totalSteps}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#0f1a33]">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{description}</p>
      <div className="mt-6">{children}</div>
      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Atrás
          </button>
        ) : (
          <span />
        )}
        <div className="flex flex-col items-stretch gap-1.5 sm:ml-auto sm:items-end">
          {nextDisabled && nextDisabledHint ? (
            <p className="text-center text-[13px] text-slate-500 sm:text-right">{nextDisabledHint}</p>
          ) : null}
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            title={nextDisabled && nextDisabledHint ? nextDisabledHint : undefined}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#c9a454] bg-[#c9a454] px-6 py-2.5 text-[14px] font-semibold text-[#0f1a33] shadow-sm transition hover:bg-[#ddb75c] disabled:cursor-not-allowed disabled:opacity-[0.72] sm:min-w-[140px]"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
