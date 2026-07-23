import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  back: vi.fn(),
  paywallContent: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, back: mocks.back }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/aerocomms/app/PaywallContent", () => ({
  PaywallContent: (props: unknown) => {
    mocks.paywallContent(props);
    return null;
  },
}));

import PaywallPage from "./page";

describe("AeroComms paywall close navigation", () => {
  it("always replaces the paywall with the dashboard instead of reusing browser history", () => {
    renderToStaticMarkup(createElement(PaywallPage));

    const props = mocks.paywallContent.mock.calls[0]?.[0] as { onClose: () => void };
    props.onClose();

    expect(mocks.replace).toHaveBeenCalledWith("/aerocomms/app/today");
    expect(mocks.back).not.toHaveBeenCalled();
  });
});
