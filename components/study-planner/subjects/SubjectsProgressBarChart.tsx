"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { SubjectChartItem } from "@/lib/study-planner/subjects-chart-data";

const Y_TICKS = [100, 75, 50, 25, 0] as const;
const CHART_HEIGHT_PX = 220;
const MIN_BAR_WIDTH_PX = 44;
const TOOLTIP_GAP_PX = 8;
const TOOLTIP_WIDTH_PX = 228;

type TooltipPlacement = {
  x: number;
  y: number;
  align: "center" | "left" | "right";
};

type SubjectsProgressBarChartProps = {
  items: SubjectChartItem[];
  onSelectSubject?: (subjectId: string) => void;
};

export function SubjectsProgressBarChart({
  items,
  onSelectSubject,
}: SubjectsProgressBarChartProps) {
  const chartTitleId = useId();
  const tooltipId = `${chartTitleId}-tooltip`;
  const chartPlotRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [activeId, setActiveId] = useState<string | null>(null);
  const [tooltipPlacement, setTooltipPlacement] = useState<TooltipPlacement | null>(null);

  const minInnerWidth = Math.max(items.length * MIN_BAR_WIDTH_PX, 280);
  const activeItem = activeId ? items.find((item) => item.subjectId === activeId) : null;

  const updateTooltipPosition = useCallback((subjectId: string) => {
    const bar = barRefs.current[subjectId];
    const plot = chartPlotRef.current;
    if (!bar || !plot) {
      setTooltipPlacement(null);
      return;
    }

    const barRect = bar.getBoundingClientRect();
    const plotRect = plot.getBoundingClientRect();
    const centerX = barRect.left - plotRect.left + barRect.width / 2;
    const edgePad = 6;
    const half = TOOLTIP_WIDTH_PX / 2;

    let align: TooltipPlacement["align"] = "center";
    let x = centerX;
    if (centerX < half + edgePad) {
      align = "left";
      x = edgePad;
    } else if (centerX > plotRect.width - half - edgePad) {
      align = "right";
      x = plotRect.width - edgePad;
    }

    setTooltipPlacement({
      x,
      y: barRect.top - plotRect.top - TOOLTIP_GAP_PX,
      align,
    });
  }, []);

  useEffect(() => {
    if (!activeId) {
      setTooltipPlacement(null);
      return;
    }
    updateTooltipPosition(activeId);
  }, [activeId, items, updateTooltipPosition]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || !activeId) return;

    const onScroll = () => updateTooltipPosition(activeId);
    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [activeId, updateTooltipPosition]);

  const handleBarActivate = useCallback(
    (subjectId: string) => {
      setActiveId((prev) => (prev === subjectId ? null : subjectId));
      onSelectSubject?.(subjectId);
    },
    [onSelectSubject],
  );

  const setBarRef = useCallback((subjectId: string, node: HTMLButtonElement | null) => {
    barRefs.current[subjectId] = node;
  }, []);

  const tooltipTransform =
    tooltipPlacement?.align === "left"
      ? "translate(0, -100%)"
      : tooltipPlacement?.align === "right"
        ? "translate(-100%, -100%)"
        : "translate(-50%, -100%)";

  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50/60 px-4 py-8 text-center text-[13px] text-slate-600 ring-1 ring-slate-200/25">
        No hay asignaturas activas para mostrar.
      </p>
    );
  }

  return (
    <section
      className="overflow-visible rounded-2xl bg-white p-3.5 shadow-[0_6px_28px_-20px_rgba(15,26,51,0.12)] ring-1 ring-slate-200/35 sm:p-4"
      aria-labelledby={chartTitleId}
    >
      <header className="mb-4 space-y-1">
        <h3 id={chartTitleId} className="text-[16px] font-semibold tracking-tight text-[#0f1a33]">
          Preparación estimada por asignatura
        </h3>
        <p className="text-[13px] leading-snug text-slate-500">
          Estimación basada en actividad de estudio, simulacros y continuidad.
        </p>
        <p className="text-[12px] leading-snug text-slate-400">
          No representa el porcentaje oficial del temario.
        </p>
      </header>

      <div ref={chartPlotRef} className="relative overflow-visible">
        {activeItem && tooltipPlacement ? (
          <div
            id={tooltipId}
            className="pointer-events-none absolute z-50 rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-left shadow-[0_4px_14px_-4px_rgba(15,26,51,0.18)]"
            style={{
              left: tooltipPlacement.x,
              top: tooltipPlacement.y,
              width: TOOLTIP_WIDTH_PX,
              transform: tooltipTransform,
            }}
            role="tooltip"
          >
            <p className="truncate text-[12px] font-semibold leading-snug text-[#0f1a33]">
              {activeItem.tooltipTitle}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-slate-600">
              {activeItem.tooltip.percentLine}
            </p>
            {activeItem.tooltip.activityBullets.length > 0 ? (
              <div className="mt-1.5 space-y-0.5">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Actividad registrada
                </p>
                {activeItem.tooltip.activityBullets.map((line) => (
                  <p key={line} className="text-[11px] leading-snug text-slate-600">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
            {activeItem.tooltip.lastActivity ? (
              <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
                {activeItem.tooltip.lastActivity}
              </p>
            ) : null}
            {activeItem.tooltip.isProvisional ? (
              <p className="mt-1 text-[11px] font-medium leading-snug text-amber-800">
                Dato provisional
              </p>
            ) : null}
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-visible pb-1 [-webkit-overflow-scrolling:touch]"
        >
          <div className="flex gap-3" style={{ minWidth: minInnerWidth }}>
            <div
              className="flex shrink-0 flex-col justify-between py-0.5 text-[11px] font-medium tabular-nums text-slate-400"
              style={{ height: CHART_HEIGHT_PX }}
              aria-hidden
            >
              {Y_TICKS.map((tick) => (
                <span key={tick}>{tick}%</span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1 overflow-visible">
              <div
                className="pointer-events-none absolute inset-0 flex flex-col justify-between"
                aria-hidden
              >
                {Y_TICKS.map((tick) => (
                  <div key={tick} className="border-t border-slate-100/90" />
                ))}
              </div>

              <div
                className="relative flex items-end justify-start gap-2 overflow-visible border-b border-slate-200/80 pl-0.5 pr-1"
                style={{ height: CHART_HEIGHT_PX }}
                role="list"
                aria-label="Preparación estimada por asignatura"
              >
                {items.map((item) => {
                  const barHeight = Math.max(
                    item.percent > 0 ? 4 : 2,
                    (item.percent / 100) * CHART_HEIGHT_PX,
                  );

                  return (
                    <div
                      key={item.subjectId}
                      role="listitem"
                      className="flex min-w-[2.75rem] max-w-[4.5rem] flex-1 flex-col items-center overflow-visible"
                    >
                      <div
                        className="relative flex w-full flex-1 items-end justify-center overflow-visible"
                        onMouseEnter={() => {
                          setActiveId(item.subjectId);
                          updateTooltipPosition(item.subjectId);
                        }}
                        onMouseLeave={() =>
                          setActiveId((prev) => (prev === item.subjectId ? null : prev))
                        }
                      >
                        <button
                          ref={(node) => setBarRef(item.subjectId, node)}
                          type="button"
                          onClick={() => handleBarActivate(item.subjectId)}
                          onFocus={() => {
                            setActiveId(item.subjectId);
                            updateTooltipPosition(item.subjectId);
                          }}
                          onBlur={() =>
                            setActiveId((prev) => (prev === item.subjectId ? null : prev))
                          }
                          className="group flex w-full max-w-[2rem] flex-col items-center justify-end focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a454]/40 focus-visible:ring-offset-1"
                          aria-label={`${item.name}, ${item.percent} por ciento`}
                          aria-describedby={
                            activeId === item.subjectId ? tooltipId : undefined
                          }
                        >
                          <span
                            className="w-full rounded-t-md shadow-[0_2px_8px_-4px_rgba(15,26,51,0.2)] transition-[height,opacity] duration-200 group-hover:opacity-95"
                            style={{
                              height: barHeight,
                              backgroundColor: item.color,
                              opacity: item.percent === 0 ? 0.35 : 1,
                            }}
                          />
                        </button>
                      </div>

                      <span
                        className="mt-2 max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-tight text-slate-600"
                        title={item.name}
                      >
                        {item.shortLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
