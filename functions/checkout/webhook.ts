import type { StripeEventLike, StripeLike } from './session'

export async function verifyWebhook(
  stripe: StripeLike,
  payload: string,
  signature: string,
  secret: string
): Promise<StripeEventLike> {
  return stripe.webhooks.constructEventAsync(payload, signature, secret)
}

export function dispatchEvent(event: StripeEventLike): void {
  if (event.type !== 'checkout.session.completed') return
  const session = event.data.object
  // A production shop would hand this off to fulfilment here: write the order, send a
  // receipt, adjust inventory. This demo has no database, so the event is only logged.
  console.log('checkout.session.completed', session.id, session.metadata?.orderId ?? null, session.payment_status ?? null)
}
