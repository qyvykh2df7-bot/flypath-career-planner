"use client";

type ClearWeekConfirmDialogProps = {
  open: boolean;
  pendingCount: number;
  weekLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ClearWeekConfirmDialog({
  open,
  pendingCount,
  weekLabel,
  onCancel,
  onConfirm,
}: ClearWeekConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#0f1a33]/40 backdrop-blur-[1px]"
        aria-label="Cerrar"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-week-title"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-slate-200/90 bg-white p-5 shadow-xl sm:rounded-2xl"
      >
        <h3 id="clear-week-title" className="text-[17px] font-semibold text-[#0f1a33]">
          ¿Seguro que quieres vaciar esta semana?
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
          Se eliminarán las sesiones planificadas pendientes de esta semana ({weekLabel}). Las
          sesiones completadas y las marcadas como saltadas se conservan.
        </p>
        {pendingCount > 0 ? (
          <p className="mt-2 text-[13px] font-medium text-amber-900">
            {pendingCount} sesión{pendingCount === 1 ? "" : "es"} pendiente{pendingCount === 1 ? "" : "s"} se
            quitarán del calendario.
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-slate-500">No hay sesiones pendientes que eliminar.</p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[14px] font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pendingCount === 0}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[14px] font-semibold text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Vaciar semana
          </button>
        </div>
      </div>
    </div>
  );
}
