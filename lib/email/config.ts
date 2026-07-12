import "server-only";

export class EmailConfigurationError extends Error {
  constructor() {
    super("Email configuration is unavailable");
    this.name = "EmailConfigurationError";
  }
}

export type EmailConfiguration = {
  apiKey: string;
  from: string;
  replyTo: string;
};

type EmailEnvironment = {
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  EMAIL_FROM?: string;
  EMAIL_REPLY_TO?: string;
  INTERNAL_ALERT_EMAIL?: string;
};

const SAFE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_REPLY_TO = "info@flypath.es";

function readRequiredEnvironmentValue(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isSafeMailbox(value: string): boolean {
  const addressMatch = value.match(/<([^>]+)>$/);
  const address = (addressMatch?.[1] ?? value).trim();
  return SAFE_EMAIL_PATTERN.test(address);
}

export function getEmailConfiguration(
  environment: EmailEnvironment = process.env as EmailEnvironment,
): EmailConfiguration {
  const apiKey = readRequiredEnvironmentValue(environment.RESEND_API_KEY);
  const from = readRequiredEnvironmentValue(environment.EMAIL_FROM);
  const replyTo = readRequiredEnvironmentValue(environment.EMAIL_REPLY_TO) ?? DEFAULT_REPLY_TO;

  if (!apiKey || !from || !isSafeMailbox(from) || !isSafeMailbox(replyTo)) {
    throw new EmailConfigurationError();
  }

  return { apiKey, from, replyTo };
}

export function getInternalAlertEmail(
  environment: EmailEnvironment = process.env as EmailEnvironment,
): string {
  const internalAlertEmail = readRequiredEnvironmentValue(environment.INTERNAL_ALERT_EMAIL);

  if (!internalAlertEmail || !SAFE_EMAIL_PATTERN.test(internalAlertEmail)) {
    throw new EmailConfigurationError();
  }

  return internalAlertEmail;
}

export function getResendWebhookSecret(
  environment: EmailEnvironment = process.env as EmailEnvironment,
): string {
  const webhookSecret = readRequiredEnvironmentValue(environment.RESEND_WEBHOOK_SECRET);

  if (!webhookSecret) throw new EmailConfigurationError();

  return webhookSecret;
}
