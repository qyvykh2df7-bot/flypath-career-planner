import "server-only";

import {
  CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY,
  getCareerPlannerConfirmationTemplate,
  type TransactionalEmailTemplate,
} from "./career-planner-confirmation";
import {
  getPrepplWaitlistConfirmationTemplate,
  PREPPL_WAITLIST_CONFIRMATION_TEMPLATE_KEY,
} from "./preppl-waitlist-confirmation";
import {
  MENTORSHIP_REQUEST_CONFIRMATION_TEMPLATE_KEY,
  getMentorshipRequestConfirmationTemplate,
} from "./mentorship-request-confirmation";
import { MENTORSHIP_INTERNAL_ALERT_TEMPLATE_KEY } from "./mentorship-internal-alert";
import { SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY } from "./school-review-verification";
import { MARKETING_OPT_IN_CONFIRMATION_TEMPLATE_KEY } from "./marketing-opt-in-confirmation";

export const TRANSACTIONAL_TEMPLATE_KEYS = [
  CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY,
  PREPPL_WAITLIST_CONFIRMATION_TEMPLATE_KEY,
  MENTORSHIP_REQUEST_CONFIRMATION_TEMPLATE_KEY,
  MENTORSHIP_INTERNAL_ALERT_TEMPLATE_KEY,
  SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY,
  MARKETING_OPT_IN_CONFIRMATION_TEMPLATE_KEY,
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
    case PREPPL_WAITLIST_CONFIRMATION_TEMPLATE_KEY:
      return getPrepplWaitlistConfirmationTemplate();
    case MENTORSHIP_REQUEST_CONFIRMATION_TEMPLATE_KEY:
      return getMentorshipRequestConfirmationTemplate();
    case MENTORSHIP_INTERNAL_ALERT_TEMPLATE_KEY:
      throw new Error("Mentorship internal alert requires server-only template input");
    case SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY:
      throw new Error("School review verification requires server-only template input");
    case MARKETING_OPT_IN_CONFIRMATION_TEMPLATE_KEY:
      throw new Error("Marketing opt-in confirmation requires server-only template input");
  }
}

export {
  CAREER_PLANNER_CONFIRMATION_TEMPLATE_KEY,
  PREPPL_WAITLIST_CONFIRMATION_TEMPLATE_KEY,
  MENTORSHIP_REQUEST_CONFIRMATION_TEMPLATE_KEY,
  MENTORSHIP_INTERNAL_ALERT_TEMPLATE_KEY,
  SCHOOL_REVIEW_VERIFICATION_TEMPLATE_KEY,
  MARKETING_OPT_IN_CONFIRMATION_TEMPLATE_KEY,
};

export type { TransactionalEmailTemplate } from "./career-planner-confirmation";
