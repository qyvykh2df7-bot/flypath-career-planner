import "server-only";

import type { TransactionalEmailTemplate } from "./career-planner-confirmation";

export const PREPPL_WAITLIST_CONFIRMATION_TEMPLATE_KEY = "preppl_waitlist_confirmation";

export function getPrepplWaitlistConfirmationTemplate(): TransactionalEmailTemplate {
  return {
    key: PREPPL_WAITLIST_CONFIRMATION_TEMPLATE_KEY,
    subject: "Tu plaza en la lista Pre-PPL está confirmada",
    subscriptionListKey: "preppl",
    text: [
      "Tu plaza en la lista de espera de Pre-PPL está confirmada.",
      "Te avisaremos cuando haya novedades relevantes sobre el producto.",
      "",
      "FlyPath",
      "info@flypath.es",
    ].join("\n"),
    html: [
      "<!doctype html><html lang=\"es\"><body style=\"margin:0;background:#f5f7fb;color:#13213c;font-family:Arial,sans-serif;\">",
      "<main style=\"max-width:600px;margin:0 auto;padding:40px 24px;\">",
      "<p style=\"margin:0 0 20px;font-weight:700;letter-spacing:.08em;color:#9a731e;\">FLYPATH</p>",
      "<h1 style=\"margin:0 0 20px;font-size:28px;line-height:1.2;\">Tu plaza en la lista Pre-PPL está confirmada</h1>",
      "<p style=\"line-height:1.6;\">Tu plaza en la lista de espera de Pre-PPL está confirmada.</p>",
      "<p style=\"line-height:1.6;\">Te avisaremos cuando haya novedades relevantes sobre el producto.</p>",
      "<p style=\"margin:32px 0 0;line-height:1.6;\">FlyPath<br><a href=\"mailto:info@flypath.es\" style=\"color:#765817;\">info@flypath.es</a></p>",
      "<p style=\"margin:32px 0 0;color:#667085;font-size:12px;line-height:1.5;\">Este es un correo operativo relacionado con una solicitud que acabas de realizar.</p>",
      "</main></body></html>",
    ].join(""),
  };
}
