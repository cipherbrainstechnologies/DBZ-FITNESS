/**
 * Push notification port. Fixture implementations must not claim real device delivery.
 */

export type PushMessage = {
  deviceToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  correlationId?: string;
};

export type PushSendResult = {
  mode: 'fixture' | 'live';
  ticketId: string;
  accepted: boolean;
  /** Explicit label when delivery is simulated. */
  deliveryNote: string;
};

export interface PushProvider {
  readonly kind: 'push';
  send(message: PushMessage): Promise<PushSendResult>;
}
