/**
 * Email delivery port. Real providers are configured later; fixtures simulate only.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  textBody: string;
  htmlBody?: string;
  correlationId?: string;
};

export type EmailSendResult = {
  /** Simulated vs real delivery must remain distinguishable. */
  mode: 'fixture' | 'live';
  messageId: string;
  accepted: boolean;
};

export interface EmailProvider {
  readonly kind: 'email';
  send(message: EmailMessage): Promise<EmailSendResult>;
}
