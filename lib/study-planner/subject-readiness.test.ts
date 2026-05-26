import { describe, expect, it } from "vitest";
import type { ErrorLogItem, MockResult, StudySession } from "./types";
import {
  buildReadinessBreakdown,
  computeReadinessConfidence,
  computeReadinessScore,
  computeSubjectReadinessMetrics,
  capPedagogicalLabel,
  PROVISIONAL_ESTIMATE_LABEL,
  qualifiesAsPrepared,
  scoreToPedagogicalLabel,
} from "./subject-readiness";
import { calculateSubjectReadiness } from "./calculations";
import { resolveSubjectDisplayStatus } from "./subjects-page-logic";

const SUBJECT = "atpl-air-law";
const TODAY = "2026-05-19";

function theorySession(overrides: Partial<StudySession> = {}): StudySession {
  return {
    id: "s-theory",
    date: TODAY,
    subjectId: SUBJECT,
    type: "theory",
    durationMinutes: 60,
    ...overrides,
  };
}

function bankSession(mins: number, id = "s-bank", date = TODAY): StudySession {
  return {
    id,
    date,
    subjectId: SUBJECT,
    type: "question_bank",
    durationMinutes: mins,
  };
}

function reviewSession(mins: number, id = "s-review", date = TODAY): StudySession {
  return {
    id,
    date,
    subjectId: SUBJECT,
    type: "review",
    durationMinutes: mins,
  };
}

function mock(score: number, id = "m1", date = TODAY): MockResult {
  return { id, date, subjectId: SUBJECT, score };
}

describe("subject-readiness — preparación estimada 60/30/10", () => {
  it("5. sin datos: 0%, Inicio, confianza baja", () => {
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions: [],
      mockResults: [],
    });
    expect(metrics.score).toBe(0);
    expect(metrics.pedagogicalLabel).toBe("Inicio");
    expect(metrics.confidence).toBe("low");
    expect(qualifiesAsPrepared({ subjectId: SUBJECT, ...metrics })).toBe(false);
  });

  it("1. 1 mock 89% + poca actividad: ~35–45%, confianza baja, etiqueta provisional", () => {
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions: [],
      mockResults: [mock(89)],
    });

    expect(metrics.score).toBeGreaterThanOrEqual(35);
    expect(metrics.score).toBeLessThanOrEqual(45);
    expect(metrics.confidence).toBe("low");
    expect(metrics.isProvisional).toBe(true);
    expect(metrics.pedagogicalLabel).toBe(PROVISIONAL_ESTIMATE_LABEL);
    expect(metrics.pedagogicalLabel).not.toBe("Preparación sólida");
    expect(metrics.pedagogicalLabel).not.toBe("Muy preparado");
  });

  it("2. 1 mock 89% + 1 sesión teoría: no supera 50–55%", () => {
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions: [theorySession()],
      mockResults: [mock(89)],
    });

    expect(metrics.score).toBeGreaterThanOrEqual(35);
    expect(metrics.score).toBeLessThanOrEqual(55);
    expect(metrics.confidence).toBe("low");
    expect(metrics.isProvisional).toBe(true);

    const readiness = calculateSubjectReadiness({
      subjectId: SUBJECT,
      sessions: [theorySession()],
      mockResults: [mock(89)],
    });
    expect(resolveSubjectDisplayStatus(readiness, [], 0, TODAY)).not.toBe("prepared");
    expect(qualifiesAsPrepared(readiness)).toBe(false);
  });

  it("3. 4 mocks 85–90% + buena base: 75–85%", () => {
    const sessions = [
      theorySession({ id: "t1", date: "2026-05-01", durationMinutes: 120 }),
      theorySession({ id: "t2", date: "2026-05-05", durationMinutes: 90 }),
      bankSession(120, "b1", "2026-05-08"),
      bankSession(120, "b2", "2026-05-12"),
      bankSession(90, "b3", "2026-05-15"),
      reviewSession(60, "r1", "2026-05-17"),
    ];
    const mocks = [mock(85, "m1"), mock(88, "m2"), mock(90, "m3"), mock(87, "m4")];
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });

    expect(metrics.score).toBeGreaterThanOrEqual(75);
    expect(metrics.score).toBeLessThanOrEqual(88);
    expect(metrics.confidence).not.toBe("low");
  });

  it("4. muchas horas + mocks altos + variedad: puede superar 85%", () => {
    const sessions = [
      theorySession({ id: "t1", date: "2026-04-01", durationMinutes: 180 }),
      theorySession({ id: "t2", date: "2026-04-10", durationMinutes: 120 }),
      bankSession(150, "b1", "2026-04-15"),
      bankSession(150, "b2", "2026-04-22"),
      bankSession(120, "b3", "2026-05-01"),
      bankSession(120, "b4", "2026-05-08"),
      reviewSession(90, "r1", "2026-05-10"),
      reviewSession(60, "r2", "2026-05-15"),
      { id: "c1", date: "2026-05-12", subjectId: SUBJECT, type: "class" as const, durationMinutes: 90 },
    ];
    const mocks = [
      mock(88, "m1", "2026-04-20"),
      mock(91, "m2", "2026-04-28"),
      mock(86, "m3", "2026-05-05"),
      mock(90, "m4", "2026-05-14"),
    ];
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });

    expect(metrics.score).toBeGreaterThan(85);
    expect(qualifiesAsPrepared({ subjectId: SUBJECT, ...metrics })).toBe(true);
  });

  it("6. solo simulacros sin estudio: máximo 65%", () => {
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions: [],
      mockResults: [mock(92), mock(88), mock(90)],
    });
    expect(metrics.score).toBeLessThanOrEqual(65);
  });

  it("7. poca actividad no puede ser Preparación sólida", () => {
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions: [theorySession({ durationMinutes: 45 })],
      mockResults: [mock(84)],
    });
    expect(metrics.pedagogicalLabel).not.toBe("Preparación sólida");
    expect(metrics.pedagogicalLabel).not.toBe("Muy preparado");
  });

  it("simulacro bajo penaliza frente a simulacros altos", () => {
    const sessions = [
      theorySession({ durationMinutes: 90 }),
      bankSession(60),
      bankSession(90, "b2"),
    ];
    const low = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: [mock(58), mock(62)],
    });
    const high = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: [mock(88), mock(90)],
    });
    expect(low.score).toBeLessThan(high.score);
  });

  it("errores pendientes penalizan el score", () => {
    const sessions = [theorySession(), bankSession(90)];
    const mocks = [mock(85), mock(82)];
    const errors: ErrorLogItem[] = [
      {
        id: "e1",
        date: TODAY,
        subjectId: SUBJECT,
        topic: "VOR",
        type: "concept",
        description: "fallo",
        status: "pending",
      },
      {
        id: "e2",
        date: TODAY,
        subjectId: SUBJECT,
        topic: "ILS",
        type: "concept",
        description: "fallo",
        status: "pending",
      },
    ];
    const without = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });
    const withErrors = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
      errorLogItems: errors,
    });
    expect(withErrors.score).toBeLessThan(without.score);
  });

  it("pocos datos: etiqueta provisional, no Muy preparado", () => {
    const label = capPedagogicalLabel("Muy preparado", "low", {
      score: 72,
      hasActivity: true,
    });
    expect(label).toBe(PROVISIONAL_ESTIMATE_LABEL);
    expect(scoreToPedagogicalLabel(92)).toBe("Muy preparado");
  });

  it("confianza media con 2 simulacros y banco moderado", () => {
    const b = buildReadinessBreakdown({
      subjectId: SUBJECT,
      sessions: [theorySession(), bankSession(120)],
      mockResults: [mock(80), mock(84)],
    });
    expect(computeReadinessConfidence(b)).toBe("medium");
    const score = computeReadinessScore(b, "medium");
    expect(score).toBeGreaterThanOrEqual(50);
  });
});
