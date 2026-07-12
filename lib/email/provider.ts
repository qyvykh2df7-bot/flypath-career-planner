import "server-only";

import { Resend } from "resend";

import { getEmailConfiguration } from "./config";

export type TransactionalEmailProviderInput = {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

export type TransactionalEmailProvider = {
  send(input: TransactionalEmailProviderInput): Promise<{ providerMessageId: string }>;
};

export class EmailProviderError extends Error {
  constructor() {
    super("Email provider rejected the message");
    this.name = "EmailProviderError";
  }
}

type ResendClient = Pick<Resend, "emails">;

export function createResendEmailProvider(client: ResendClient): TransactionalEmailProvider {
  return {
    async send(input) {
      const { data, error } = await client.emails.send({
        from: input.from,
        to: [input.to],
        replyTo: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error || !data?.id) {
        throw new EmailProviderError();
      }

      return { providerMessageId: data.id };
    },
  };
}

export function getResendEmailProvider(): TransactionalEmailProvider {
  const configuration = getEmailConfiguration();
  return createResendEmailProvider(new Resend(configuration.apiKey));
}
