import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getWarhomeUserDetail: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/warhome/user-detail", () => ({
  getWarhomeUserDetail: mocks.getWarhomeUserDetail,
  WarhomeUserNotFoundError: class WarhomeUserNotFoundError extends Error {},
}));
vi.mock("@/components/warhome/WarhomeUserDetail", () => ({
  WarhomeUserDetail: () => null,
}));
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import WarhomeUserDetailPage from "./page";
import { WarhomeUserNotFoundError } from "@/lib/warhome/user-detail";

const USER_ID = "5a63c9bf-b72e-4c61-a23f-76b40bb91723";
const detail = {
  identity: { email: "pilot@example.com", emailConfirmed: true, createdAt: "2026-07-12T10:00:00.000Z", lastSignInAt: null },
  profile: { fullName: "Piloto", preferredLanguage: null, timezone: null, trainingStage: null, careerGoal: null, isIncomplete: false },
  aerocomms: { status: "not_synced", hasProgress: false, sessionCount: 0, scoredSessionCount: 0, completedExerciseCount: 0, completedMissionCount: 0, streakDays: 0, lastActivityAt: null, lastActivityDate: null, legacyImportedAt: null, resetAt: null },
  recentSessions: [], lead: null, marketing: { status: "not_applicable", subscriptions: [] }, purchases: { status: "not_available" },
};

beforeEach(() => vi.clearAllMocks());

describe("Warhome user detail page", () => {
  it("consulta el detalle server-only para un identificador de ruta", async () => {
    mocks.getWarhomeUserDetail.mockResolvedValue(detail);
    await WarhomeUserDetailPage({ params: Promise.resolve({ userId: USER_ID }) });
    expect(mocks.getWarhomeUserDetail).toHaveBeenCalledWith(USER_ID);
  });

  it("muestra un error genérico sin detalles internos", async () => {
    mocks.getWarhomeUserDetail.mockRejectedValue(new Error("private database detail"));
    const markup = renderToStaticMarkup(
      await WarhomeUserDetailPage({ params: Promise.resolve({ userId: USER_ID }) }),
    );
    expect(markup).toContain("No se ha podido cargar la ficha");
    expect(markup).not.toContain("private database detail");
  });

  it("usa notFound para usuario inexistente", async () => {
    mocks.getWarhomeUserDetail.mockRejectedValue(new WarhomeUserNotFoundError());
    await expect(WarhomeUserDetailPage({ params: Promise.resolve({ userId: USER_ID }) })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledOnce();
  });
});
