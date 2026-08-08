import "server-only";

import type { TransactionalEmailTemplate } from "./career-planner-confirmation";

export const PREPPL_PURCHASE_CONFIRMATION_TEMPLATE_KEY = "preppl_purchase_confirmation";

const PREPPL_SUCCESS_URL = "https://www.flypath.es/pre-ppl/checkout/success";

export function getPrePplPurchaseConfirmationTemplate(): TransactionalEmailTemplate {
  return {
    key: PREPPL_PURCHASE_CONFIRMATION_TEMPLATE_KEY,
    subject: "Tu guía Pre-PPL de FlyPath está lista",
    recipient: { kind: "order" },
    text: [
      "Tu pago se ha confirmado y tu guía Pre-PPL ya está disponible.",
      "Para descargarla de forma segura, vuelve al navegador en el que completaste la compra y selecciona ‘Descargar guía’.",
      `También puedes volver a ${PREPPL_SUCCESS_URL}.`,
      "",
      "FlyPath",
      "info@flypath.es",
    ].join("\n"),
    html: [
      "<!doctype html><html lang=\"es\"><body style=\"margin:0;background:#f5f7fb;color:#13213c;font-family:Arial,sans-serif;\">",
      "<main style=\"max-width:600px;margin:0 auto;padding:40px 24px;\">",
      "<p style=\"margin:0 0 20px;font-weight:700;letter-spacing:.08em;color:#9a731e;\">FLYPATH</p>",
      "<h1 style=\"margin:0 0 20px;font-size:28px;line-height:1.2;\">Tu guía Pre-PPL está lista</h1>",
      "<p style=\"line-height:1.6;\">Tu pago se ha confirmado y tu guía Pre-PPL ya está disponible.</p>",
      "<p style=\"line-height:1.6;\">Para descargarla de forma segura, vuelve al navegador en el que completaste la compra y selecciona <strong>Descargar guía</strong>.</p>",
      `<p style=\"margin:28px 0;\"><a href=\"${PREPPL_SUCCESS_URL}\" style=\"display:inline-block;background:#13213c;color:#fff;padding:12px 18px;text-decoration:none;font-weight:700;\">Volver a Pre-PPL</a></p>`,
      "<p style=\"margin:32px 0 0;line-height:1.6;\">FlyPath<br><a href=\"mailto:info@flypath.es\" style=\"color:#765817;\">info@flypath.es</a></p>",
      "<p style=\"margin:32px 0 0;color:#667085;font-size:12px;line-height:1.5;\">Este es un correo operativo relacionado con una compra que acabas de realizar.</p>",
      "</main></body></html>",
    ].join(""),
  };
}
