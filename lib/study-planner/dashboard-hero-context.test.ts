import { describe, expect, it } from "vitest";
import type { PlannedStudySession } from "./types";
import { getPlannerMetrics } from "./planner-metrics";
import { buildDashboardHeroFromMetrics } from "./dashboard-hero-context";

const WEEK_START = "2026-05-18";
const TODAY = "2026-05-19";

function planned(
  overrides: Partial<PlannedStudySession> & Pick<PlannedStudySession, "id" | "status">,
): PlannedStudySession {
  return {
    date: WEEK_START,
    subjectId: "atpl-air-law",
    type: "theory",
    plannedDurationMinutes: 45,
    source: "auto",
    ...overrides,
  };
}

function hero(plannedSessions: PlannedStudySession[]) {
  const metrics = getPlannerMetrics(plannedSessions, {
    weekStartDate: WEEK_START,
    today: TODAY,
  });
  return buildDashboardHeroFromMetrics(metrics);
}

describe("buildDashboardHeroFromMetrics", () => {
  it("Caso A: pendientes hoy → Siguiente bloque y Empezar sesión", () => {
    const ctx = hero([
      planned({ id: "today-p", status: "pending", date: TODAY }),
      planned({ id: "tomorrow", status: "pending", date: "2026-05-20" }),
    ]);

    expect(ctx.sectionLabel).toBe("Siguiente bloque");
    expect(ctx.blockPositionLine).toBe("Bloque 1 de 2");
    expect(ctx.durationLine).toContain("45 min");
    expect(ctx.metaLine).toBeUndefined();
    expect(ctx.ctaLabel).toBe("Empezar sesión");
    expect(ctx.primaryAction).toBe("start_session");
    expect(ctx.focusPlannedSessionId).toBe("today-p");
  });

  it("Caso B: hoy completado y semana pendiente → Día completado y Adelantar", () => {
    const ctx = hero([
      planned({ id: "today-done", status: "completed", date: TODAY }),
      planned({ id: "next", status: "pending", date: "2026-05-20" }),
    ]);

    expect(ctx.sectionLabel).toBe("Día completado");
    expect(ctx.title).toBe("Has completado tu estudio de hoy");
    expect(ctx.metaLine).toMatch(/Tu siguiente sesión es Air Law/);
    expect(ctx.ctaLabel).toBe("Adelantar siguiente sesión");
    expect(ctx.primaryAction).toBe("advance_session");
    expect(ctx.focusPlannedSessionId).toBe("next");
  });

  it("no muestra Siguiente bloque si hoy ya está completado", () => {
    const ctx = hero([
      planned({ id: "today-done", status: "completed", date: TODAY }),
      planned({ id: "next", status: "pending", date: "2026-05-20" }),
    ]);

    expect(ctx.sectionLabel).not.toBe("Siguiente bloque");
    expect(ctx.ctaLabel).not.toBe("Empezar sesión");
  });

  it("Caso C: semana completada", () => {
    const ctx = hero([
      planned({ id: "c1", status: "completed", date: TODAY }),
      planned({ id: "c2", status: "completed", date: "2026-05-20" }),
    ]);

    expect(ctx.sectionLabel).toBe("Semana completada");
    expect(ctx.title).toBe("Has cerrado tu semana de estudio");
    expect(ctx.ctaLabel).toBe("Ver calendario");
    expect(ctx.primaryAction).toBe("view_calendar");
    expect(ctx.secondaryLink).toBe("none");
  });

  it("Caso D: sesiones saltadas sin pendientes", () => {
    const ctx = hero([
      planned({ id: "sk1", status: "skipped", date: TODAY }),
      planned({ id: "c1", status: "completed", date: "2026-05-20" }),
    ]);

    expect(ctx.sectionLabel).toBe("Sesiones por recuperar");
    expect(ctx.title).toBe("Hay bloques que no se han completado");
    expect(ctx.ctaLabel).toBe("Reorganizar semana");
    expect(ctx.primaryAction).toBe("reorganize_week");
    expect(ctx.secondaryLink).toBe("calendar");
  });

  it("Caso B tiene prioridad sobre D si hoy completado y quedan pendientes", () => {
    const ctx = hero([
      planned({ id: "today-done", status: "completed", date: TODAY }),
      planned({ id: "sk", status: "skipped", date: WEEK_START }),
      planned({ id: "next", status: "pending", date: "2026-05-21" }),
    ]);

    expect(ctx.sectionLabel).toBe("Día completado");
    expect(ctx.primaryAction).toBe("advance_session");
  });
});
