import "server-only";

import type { TransactionalEmailTemplate } from "./career-planner-confirmation";

export const SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY = "school_review_verification" as const;

export function getSchoolReviewVerificationTemplate(input: {
  verificationLink: string;
  expiresAt: string;
}): TransactionalEmailTemplate {
  const expiresAt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(input.expiresAt));

  return {
    key: SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY,
    subject: "Verifica tu opinión sobre una escuela en FlyPath",
    recipient: { kind: "lead" },
    text: [
      "Gracias por compartir tu experiencia con FlyPath.",
      "Para enviarla a revisión, verifica tu email con este enlace:",
      input.verificationLink,
      `El enlace caduca el ${expiresAt}.`,
      "Este mensaje es transaccional y no te suscribe a comunicaciones comerciales.",
      "FlyPath",
    ].join("\n\n"),
    html: `<main style="font-family:Arial,sans-serif;color:#0f1a33;line-height:1.55;max-width:620px;margin:0 auto;padding:24px">
  <h1 style="font-size:22px;margin:0 0 16px">Verifica tu opinión</h1>
  <p>Gracias por compartir tu experiencia con FlyPath.</p>
  <p>Para enviarla a revisión, verifica tu email mediante este enlace:</p>
  <p><a href="${input.verificationLink}" style="display:inline-block;background:#c9a454;color:#0f1a33;padding:12px 18px;border-radius:8px;font-weight:700;text-decoration:none">Verificar opinión</a></p>
  <p style="font-size:14px;color:#475569">El enlace caduca el ${expiresAt}. Este mensaje no te suscribe a comunicaciones comerciales.</p>
  <p style="margin-top:24px">FlyPath</p>
</main>`,
  };
}
