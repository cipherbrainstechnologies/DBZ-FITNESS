import type { PushMessage, PushProvider, PushSendResult } from '../push.js';

let fixturePushSeq = 0;

/**
 * Fixture push provider — logs/simulates only. Does not contact device APNs/FCM.
 */
export class FixturePushProvider implements PushProvider {
  readonly kind = 'push' as const;
  readonly label = 'fixture' as const;

  async send(message: PushMessage): Promise<PushSendResult> {
    fixturePushSeq += 1;
    const ticketId = `fixture-push-${fixturePushSeq}`;
    console.info('[fixture:push] simulated delivery (not sent to a real device)', {
      ticketId,
      deviceTokenSuffix: message.deviceToken.slice(-6),
      title: message.title,
      correlationId: message.correlationId ?? null,
    });
    return {
      mode: 'fixture',
      ticketId,
      accepted: true,
      deliveryNote:
        'FIXTURE: push was simulated locally and was not delivered to a real device.',
    };
  }
}
