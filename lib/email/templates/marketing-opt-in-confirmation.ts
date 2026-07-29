import "server-only";

import type { TransactionalEmailTemplate } from "./career-planner-confirmation";

export const MARKETING_OPT_IN_CONFIRMATION_TEMPLATE_KEY = "marketing_opt_in_confirmation";

export function getMarketingOptInConfirmationTemplate(input: {
  confirmationLink: string;
  expiresAt: string;
}): TransactionalEmailTemplate {
  const expiry = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(input.expiresAt));
  return {
    key: MARKETING_OPT_IN_CONFIRMATION_TEMPLATE_KEY,
    subject: "Confirma tu suscripción a FlyPath",
    recipient: { kind: "lead" },
    text: [
      "Confirma que quieres recibir novedades y recursos de FlyPath.",
      input.confirmationLink,
      `Este enlace caduca el ${expiry}.`,
      "Si no solicitaste esta suscripción, no necesitas hacer nada.",
    ].join("\n\n"),
    html: [
      "<!doctype html><html lang=\"es\"><body style=\"margin:0;background:#f5f7fb;color:#13213c;font-family:Arial,sans-serif;\">",
      "<main style=\"max-width:600px;margin:0 auto;padding:40px 24px;\">",
      "<p style=\"margin:0 0 20px;font-weight:700;letter-spacing:.08em;color:#9a731e;\">FLYPATH</p>",
      "<h1 style=\"margin:0 0 20px;font-size:28px;line-height:1.2;\">Confirma tu suscripción</h1>",
      "<p style=\"line-height:1.6;\">Confirma que quieres recibir novedades y recursos de FlyPath por email.</p>",
      `<p><a href=\"${input.confirmationLink}\" style=\"display:inline-block;background:#c9a454;color:#0f1a33;padding:12px 18px;border-radius:8px;font-weight:700;text-decoration:none\">Confirmar suscripción</a></p>`,
      `<p style=\"color:#667085;font-size:12px;line-height:1.5;\">El enlace caduca el ${expiry}. Si no solicitaste esta suscripción, no necesitas hacer nada.</p>`,
      "</main></body></html>",
    ].join(""),
  };
}
