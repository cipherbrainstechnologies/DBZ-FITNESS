import type { EmailMessage, EmailProvider, EmailSendResult } from '../email.js';

let fixtureEmailSeq = 0;

/**
 * Fixture email provider — logs/simulates only. Not real SMTP or API delivery.
 */
export class FixtureEmailProvider implements EmailProvider {
  readonly kind = 'email' as const;
  readonly label = 'fixture' as const;

  async send(message: EmailMessage): Promise<EmailSendResult> {
    fixtureEmailSeq += 1;
    const messageId = `fixture-email-${fixtureEmailSeq}`;
    console.info('[fixture:email] simulated send', {
      messageId,
      to: message.to,
      subject: message.subject,
      correlationId: message.correlationId ?? null,
    });
    return {
      mode: 'fixture',
      messageId,
      accepted: true,
    };
  }
}
