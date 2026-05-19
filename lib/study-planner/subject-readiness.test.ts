import { describe, expect, it } from "vitest";
import type { ErrorLogItem, MockResult, StudySession } from "./types";
import {
  buildReadinessBreakdown,
  computeReadinessConfidence,
  computeReadinessScore,
  computeSubjectReadinessMetrics,
  capPedagogicalLabel,
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

function bankSession(mins: number, id = "s-bank"): StudySession {
  return {
    id,
    date: TODAY,
    subjectId: SUBJECT,
    type: "question_bank",
    durationMinutes: mins,
  };
}

function mock(score: number, id = "m1"): MockResult {
  return { id, date: TODAY, subjectId: SUBJECT, score };
}

describe("subject-readiness", () => {
  it("sin datos: Inicio y confianza baja", () => {
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

  it("1 teoría + 1 simulacro 89: no preparado, etiqueta acotada, confianza baja", () => {
    const sessions = [theorySession()];
    const mocks = [mock(89)];
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });

    expect(metrics.score).toBeGreaterThanOrEqual(45);
    expect(metrics.score).toBeLessThanOrEqual(65);
    expect(metrics.pedagogicalLabel).toBe("Primeras señales positivas");
    expect(metrics.confidence).toBe("low");
    expect(metrics.isProvisional).toBe(true);
    expect(metrics.message).toMatch(/pocos datos/i);

    const readiness = calculateSubjectReadiness({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });
    expect(resolveSubjectDisplayStatus(readiness, [], 0, TODAY)).not.toBe("prepared");
    expect(qualifiesAsPrepared(readiness)).toBe(false);
  });

  it("3 simulacros altos + banco + teoría: preparación sólida y confianza alta", () => {
    const sessions = [
      theorySession({ durationMinutes: 120 }),
      bankSession(90, "b1"),
      bankSession(120, "b2"),
      bankSession(100, "b3"),
    ];
    const mocks = [mock(88, "m1"), mock(91, "m2"), mock(86, "m3")];
    const metrics = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });

    expect(metrics.score).toBeGreaterThanOrEqual(80);
    expect(["Preparación sólida", "Muy preparado", "Progresando bien"]).toContain(
      metrics.pedagogicalLabel,
    );
    expect(metrics.confidence).toBe("high");
    expect(qualifiesAsPrepared({ subjectId: SUBJECT, ...metrics })).toBe(true);
  });

  it("simulacro bajo penaliza la preparación", () => {
    const sessions = [theorySession({ durationMinutes: 90 }), bankSession(60)];
    const mocks = [mock(58), mock(62)];
    const highMocks = [mock(88), mock(90)];
    const low = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: mocks,
    });
    const high = computeSubjectReadinessMetrics({
      subjectId: SUBJECT,
      sessions,
      mockResults: highMocks,
    });
    expect(low.score).toBeLessThan(high.score);
  });

  it("errores pendientes penalizan y bajan etiqueta", () => {
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

  it("pocos datos no permiten etiqueta alta aunque el score bruto sea alto", () => {
    const label = capPedagogicalLabel("Muy preparado", "low");
    expect(label).toBe("Primeras señales positivas");
    expect(scoreToPedagogicalLabel(92)).toBe("Muy preparado");
  });

  it("confianza media con 1-2 simulacros y banco moderado", () => {
    const b = buildReadinessBreakdown({
      subjectId: SUBJECT,
      sessions: [theorySession(), bankSession(120)],
      mockResults: [mock(80), mock(84)],
    });
    expect(computeReadinessConfidence(b)).toBe("medium");
    const score = computeReadinessScore(b, "medium");
    expect(score).toBeGreaterThan(50);
  });
});
