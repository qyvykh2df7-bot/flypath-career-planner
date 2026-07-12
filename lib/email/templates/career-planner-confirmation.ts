import "server-only";

export const CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY = "career_planner_confirmation";

export type TransactionalEmailTemplate = {
  key: string;
  subject: string;
  html: string;
  text: string;
  subscriptionListKey: "career_planner" | "preppl";
};

export function getCareerPlannerConfirmationTemplate(): TransactionalEmailTemplate {
  return {
    key: CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY,
    subject: "Tu Career Planner de FlyPath está listo",
    subscriptionListKey: "career_planner",
    text: [
      "Hemos recibido tu solicitud del informe gratuito de Career Planner.",
      "Tu informe se genera y descarga directamente desde Career Planner al completar la solicitud.",
      "Si la descarga no se abrió, vuelve a tu informe y selecciona de nuevo ‘Descargar informe gratuito’.",
      "",
      "FlyPath",
      "info@flypath.es",
    ].join("\n"),
    html: [
      "<!doctype html><html lang=\"es\"><body style=\"margin:0;background:#f5f7fb;color:#13213c;font-family:Arial,sans-serif;\">",
      "<main style=\"max-width:600px;margin:0 auto;padding:40px 24px;\">",
      "<p style=\"margin:0 0 20px;font-weight:700;letter-spacing:.08em;color:#9a731e;\">FLYPATH</p>",
      "<h1 style=\"margin:0 0 20px;font-size:28px;line-height:1.2;\">Tu Career Planner está listo</h1>",
      "<p style=\"line-height:1.6;\">Hemos recibido tu solicitud del informe gratuito de Career Planner.</p>",
      "<p style=\"line-height:1.6;\">Tu informe se genera y descarga directamente desde Career Planner al completar la solicitud. Si la descarga no se abrió, vuelve a tu informe y selecciona de nuevo <strong>Descargar informe gratuito</strong>.</p>",
      "<p style=\"margin:32px 0 0;line-height:1.6;\">FlyPath<br><a href=\"mailto:info@flypath.es\" style=\"color:#765817;\">info@flypath.es</a></p>",
      "<p style=\"margin:32px 0 0;color:#667085;font-size:12px;line-height:1.5;\">Este es un correo operativo relacionado con una solicitud que acabas de realizar.</p>",
      "</main></body></html>",
    ].join(""),
  };
}
