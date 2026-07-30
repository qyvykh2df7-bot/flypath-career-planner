import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/warhome/(protected)/content/actions", () => ({
  importContentOsHistoricalItemAction: vi.fn(),
}));

import { ContentHistoricalImportForm } from "./ContentHistoricalImportForm";

describe("ContentHistoricalImportForm", () => {
  it("usa los pilares configurados en Brand DNA", () => {
    const markup = renderToStaticMarkup(
      createElement(ContentHistoricalImportForm, {
        contentPillars: ["Vida en cabina", "Decisiones de carrera"],
      }),
    );

    expect(markup).toContain("Vida en cabina");
    expect(markup).toContain("Decisiones de carrera");
    expect(markup).not.toContain("Escuelas y decisiones");
  });
});
