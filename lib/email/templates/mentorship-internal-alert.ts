import "server-only";

import type { MentorshipSupportSituation } from "@/lib/leads/mentorship-support-consent";

import type { TransactionalEmailTemplate } from "./career-planner-confirmation";

export const MENTORSHIP_INTERNAL_ALERT_TEMPLATE_KEY = "mentorship_internal_alert";

export type MentorshipInternalAlertTemplateInput = {
  fullName: string;
  email: string;
  phone: string | null;
  situation: MentorshipSupportSituation;
  helpText: string;
  receivedAt: string;
};

const SITUATION_LABELS: Record<MentorshipSupportSituation, string> = {
  not_started: "Aún no ha empezado",
  comparing_schools: "Comparando escuelas",
  in_training: "Ya está en formación",
  job_seeking: "Buscando trabajo como piloto",
  other: "Otra",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toHtmlParagraph(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

export function getMentorshipInternalAlertTemplate(
  input: MentorshipInternalAlertTemplateInput,
): TransactionalEmailTemplate {
  const situation = SITUATION_LABELS[input.situation];
  const phoneLines = input.phone ? [`Teléfono: ${input.phone}`] : [];
  const phoneHtml = input.phone
    ? `<p style=\"line-height:1.6;\"><strong>Teléfono:</strong> ${escapeHtml(input.phone)}</p>`
    : "";

  return {
    key: MENTORSHIP_INTERNAL_ALERT_TEMPLATE_KEY,
    subject: "Nueva solicitud de acompañamiento en FlyPath",
    recipient: { kind: "internal" },
    text: [
      "Nueva solicitud de acompañamiento",
      `Nombre: ${input.fullName}`,
      `Email: ${input.email}`,
      ...phoneLines,
      `Situación: ${situation}`,
      `Ayuda solicitada: ${input.helpText}`,
      `Fecha de recepción: ${input.receivedAt}`,
    ].join("\n"),
    html: [
      "<!doctype html><html lang=\"es\"><body style=\"margin:0;background:#f5f7fb;color:#13213c;font-family:Arial,sans-serif;\">",
      "<main style=\"max-width:600px;margin:0 auto;padding:40px 24px;\">",
      "<p style=\"margin:0 0 20px;font-weight:700;letter-spacing:.08em;color:#9a731e;\">FLYPATH · INTERNO</p>",
      "<h1 style=\"margin:0 0 20px;font-size:26px;line-height:1.2;\">Nueva solicitud de acompañamiento</h1>",
      `<p style=\"line-height:1.6;\"><strong>Nombre:</strong> ${escapeHtml(input.fullName)}</p>`,
      `<p style=\"line-height:1.6;\"><strong>Email:</strong> ${escapeHtml(input.email)}</p>`,
      phoneHtml,
      `<p style=\"line-height:1.6;\"><strong>Situación:</strong> ${escapeHtml(situation)}</p>`,
      `<p style=\"line-height:1.6;\"><strong>Ayuda solicitada:</strong><br>${toHtmlParagraph(input.helpText)}</p>`,
      `<p style=\"line-height:1.6;\"><strong>Fecha de recepción:</strong> ${escapeHtml(input.receivedAt)}</p>`,
      "</main></body></html>",
    ].join(""),
  };
}
