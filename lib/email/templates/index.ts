import "server-only";

import {
  CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY,
  getCareerPlannerConfirmationTemplate,
  type TransactionalEmailTemplate,
} from "./career-planner-confirmation";

export const TRANSACTIONAL_TEMPLATE_KEYS = [
  CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY,
] as const;

export type TransactionalTemplateKey = (typeof TRANSACTIONAL_TEMPLATE_KEYS)[number];

export function isTransactionalTemplateKey(value: unknown): value is TransactionalTemplateKey {
  return typeof value === "string" && TRANSACTIONAL_TEMPLATE_KEYS.includes(value as TransactionalTemplateKey);
}

export function getTransactionalEmailTemplate(
  templateKey: TransactionalTemplateKey,
): TransactionalEmailTemplate {
  switch (templateKey) {
    case CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY:
      return getCareerPlannerConfirmationTemplate();
  }
}

export { CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY };
