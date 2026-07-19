import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  formatWarhomeUserDetailDate,
  WarhomeUserDetail,
} from "./WarhomeUserDetail";
import type { WarhomeUserDetail as WarhomeUserDetailData } from "@/lib/warhome/user-detail";

const USER_ID = "5a63c9bf-b72e-4c61-a23f-76b40bb91723";
const LEAD_ID = "2c0d0d42-f8ec-4fc3-bb19-64b8ad15d22e";

function detail(overrides: Partial<WarhomeUserDetailData> = {}): WarhomeUserDetailData {
  return {
    identity: {
      email: "pilot@example.com", emailConfirmed: true,
      createdAt: "2026-07-12T10:00:00.000Z", lastSignInAt: "2026-07-14T10:00:00.000Z",
    },
    profile: {
      fullName: "Piloto de prueba", preferredLanguage: "es", timezone: "Europe/Madrid",
      trainingStage: "exploring", careerGoal: "airline_pilot", isIncomplete: false,
    },
    aerocomms: {
      status: "active", hasProgress: true, sessionCount: 4, scoredSessionCount: 3,
      completedExerciseCount: 2, completedMissionCount: 1, streakDays: 2,
      lastActivityAt: "2026-07-14T10:00:00.000Z", lastActivityDate: "2026-07-14",
      legacyImportedAt: "2026-07-13T10:00:00.000Z", resetAt: "2026-07-15T10:00:00.000Z",
    },
    recentSessions: [{
      activityType: "mission", source: "atc-mission", levelId: "ready-for-radio", score: 91,
      isScored: true, occurredAt: "2026-07-14T10:00:00.000Z", activityDate: "2026-07-14",
      label: "Misión ATC",
    }],
    lead: {
      id: LEAD_ID, latestSource: "career_planner", funnelStage: "interested",
      status: "active", createdAt: "2026-07-12T10:00:00.000Z",
    },
    marketing: {
      status: "subscribed",
      subscriptions: [{ listKey: "aerocomms", status: "subscribed", source: "aerocomms", statusChangedAt: "2026-07-12T10:00:00.000Z" }],
    },
    purchases: { status: "not_available" },
    ...overrides,
  };
}

function render(detailData: WarhomeUserDetailData): string {
  return renderToStaticMarkup(createElement(WarhomeUserDetail, { detail: detailData }));
}

describe("WarhomeUserDetail", () => {
  it("muestra identidad, perfil, resumen, sesiones, lead y marketing", () => {
    const markup = render(detail());

    expect(markup).toContain("Piloto de prueba");
    expect(markup).toContain("pilot@example.com");
    expect(markup).toContain("Confirmado");
    expect(markup).toContain("Explorando opciones");
    expect(markup).toContain("Activo");
    expect(markup).toContain("Puntuación: 91");
    expect(markup).toContain(`/warhome/leads/${LEAD_ID}`);
    expect(markup).toContain("Suscrito");
    expect(markup).toContain("Disponible cuando se implemente Pagos y entitlements.");
    expect(markup).toContain('href="/warhome/users"');
  });

  it("muestra fallbacks claros para perfil, progreso, sesiones, lead y marketing ausentes", () => {
    const markup = render(detail({
      profile: { fullName: null, preferredLanguage: null, timezone: null, trainingStage: null, careerGoal: null, isIncomplete: true },
      aerocomms: {
        status: "not_synced", hasProgress: false, sessionCount: 0, scoredSessionCount: 0,
        completedExerciseCount: 0, completedMissionCount: 0, streakDays: 0, lastActivityAt: null,
        lastActivityDate: null, legacyImportedAt: null, resetAt: null,
      },
      recentSessions: [], lead: null, marketing: { status: "not_applicable", subscriptions: [] },
    }));

    expect(markup).toContain("Sin nombre");
    expect(markup).toContain("Estado del perfil");
    expect(markup).toContain("Incompleto");
    expect(markup).toContain("Sin sincronizar");
    expect(markup).toContain("Sin sesiones registradas");
    expect(markup).toContain("Sin lead comercial");
    expect(markup).toContain("No aplicable sin lead comercial");
  });

  it("no serializa metadata, IDs de usuario ni IDs de sesión ajenos al enlace de lead", () => {
    const unsafe = detail() as WarhomeUserDetailData & {
      userMetadata: unknown;
      sessionToken: string;
      clientSessionId: string;
    };
    unsafe.userMetadata = { email: "private@example.com" };
    unsafe.sessionToken = "secret-token";
    unsafe.clientSessionId = "private-session";
    const markup = render(unsafe);

    expect(markup).not.toContain("private@example.com");
    expect(markup).not.toContain("secret-token");
    expect(markup).not.toContain("private-session");
    expect(markup).not.toContain(USER_ID);
  });

  it("formatea fechas ausentes o inválidas de forma segura", () => {
    expect(formatWarhomeUserDetailDate(null)).toBe("Sin datos");
    expect(formatWarhomeUserDetailDate("not-a-date")).toBe("Sin datos");
  });
});
