import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bootstrapFlyPathIdentity: vi.fn(),
  getFlyPathAccountProfile: vi.fn(),
  getFlyPathSessionState: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/image", () => ({ default: "img" }));
vi.mock("lucide-react", () => ({ UserRound: "svg" }));
vi.mock("@/lib/account/bootstrap", () => ({ bootstrapFlyPathIdentity: mocks.bootstrapFlyPathIdentity }));
vi.mock("@/lib/account/profile", () => ({ getFlyPathAccountProfile: mocks.getFlyPathAccountProfile }));
vi.mock("@/lib/auth/session", () => ({ getFlyPathSessionState: mocks.getFlyPathSessionState }));
vi.mock("./AccountLogoutButton", () => ({ AccountLogoutButton: "button" }));
vi.mock("./AccountProfileForm", () => ({ AccountProfileForm: "form" }));

import AccountPage from "./page";

const ACCOUNT = { email: "pilot@example.com", fullName: "Ana Pilot" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.redirect.mockImplementation((destination: string) => {
    throw new Error(`redirect:${destination}`);
  });
  mocks.getFlyPathSessionState.mockResolvedValue({
    status: "authenticated",
    account: { id: "user-id", email: ACCOUNT.email },
  });
  mocks.getFlyPathAccountProfile.mockResolvedValue({ status: "authenticated", account: ACCOUNT });
  mocks.bootstrapFlyPathIdentity.mockResolvedValue({ status: "ready" });
});

describe("AccountPage", () => {
  it("redirige al login antes de consultar el perfil cuando el visitante es anónimo", async () => {
    mocks.getFlyPathSessionState.mockResolvedValue({ status: "anonymous" });

    await expect(AccountPage()).rejects.toThrow("redirect:/login?next=%2Faccount");
    expect(mocks.getFlyPathAccountProfile).not.toHaveBeenCalled();
    expect(mocks.bootstrapFlyPathIdentity).not.toHaveBeenCalled();
  });

  it("permite cargar la cuenta cuando el usuario está autenticado", async () => {
    await expect(AccountPage()).resolves.toBeTruthy();
    expect(mocks.getFlyPathAccountProfile).toHaveBeenCalledTimes(2);
    expect(mocks.bootstrapFlyPathIdentity).toHaveBeenCalledTimes(1);
  });
});
