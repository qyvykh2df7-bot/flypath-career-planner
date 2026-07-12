import "server-only";

import type { TransactionalEmailTemplate } from "./career-planner-confirmation";

export const MENTORSHIP_REQUEST_CONFIRMATION_TEMPLATE_KEY = "mentorship_request_confirmation";

export function getMentorshipRequestConfirmationTemplate(): TransactionalEmailTemplate {
  return {
    key: MENTORSHIP_REQUEST_CONFIRMATION_TEMPLATE_KEY,
    subject: "Hemos recibido tu solicitud de acompañamiento",
    recipient: { kind: "lead", subscriptionListKey: null },
    text: [
      "Hemos recibido tu solicitud de acompañamiento.",
      "El equipo de FlyPath revisará la información que nos has enviado.",
      "",
      "FlyPath",
      "info@flypath.es",
    ].join("\n"),
    html: [
      "<!doctype html><html lang=\"es\"><body style=\"margin:0;background:#f5f7fb;color:#13213c;font-family:Arial,sans-serif;\">",
      "<main style=\"max-width:600px;margin:0 auto;padding:40px 24px;\">",
      "<p style=\"margin:0 0 20px;font-weight:700;letter-spacing:.08em;color:#9a731e;\">FLYPATH</p>",
      "<h1 style=\"margin:0 0 20px;font-size:28px;line-height:1.2;\">Hemos recibido tu solicitud de acompañamiento</h1>",
      "<p style=\"line-height:1.6;\">Hemos recibido tu solicitud de acompañamiento.</p>",
      "<p style=\"line-height:1.6;\">El equipo de FlyPath revisará la información que nos has enviado.</p>",
      "<p style=\"margin:32px 0 0;line-height:1.6;\">FlyPath<br><a href=\"mailto:info@flypath.es\" style=\"color:#765817;\">info@flypath.es</a></p>",
      "<p style=\"margin:32px 0 0;color:#667085;font-size:12px;line-height:1.5;\">Este es un correo operativo relacionado con una solicitud que acabas de realizar.</p>",
      "</main></body></html>",
    ].join(""),
  };
}
