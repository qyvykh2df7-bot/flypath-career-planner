import { AlertTriangle } from "lucide-react";

export function ContentOsLoadError() {
  return (
    <section className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d192a] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-300/10">
        <AlertTriangle className="h-6 w-6 text-amber-100" aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-white">No se ha podido cargar Content OS</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        Inténtalo de nuevo. Si el problema continúa, revisa el estado del servicio.
      </p>
    </section>
  );
}
