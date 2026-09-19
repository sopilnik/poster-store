// @vitest-environment node
import type { StripeEventLike, StripeLike } from './session'
import { dispatchEvent, verifyWebhook } from './webhook'

function fakeStripe(constructEventAsync: StripeLike['webhooks']['constructEventAsync']): StripeLike {
  return {
    checkout: {
      sessions: {
        create: async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.test/s' }),
        retrieve: async () => {
          throw new Error('not used in this test')
        },
      },
    },
    webhooks: { constructEventAsync },
  }
}

test('verifyWebhook rejects a bad signature', async () => {
  const stripe = fakeStripe(async () => {
    throw new Error('bad signature')
  })
  await expect(verifyWebhook(stripe, '{}', 'bad-sig', 'whtest')).rejects.toThrow('bad signature')
})

test('verifyWebhook returns the verified event on a good signature', async () => {
  const event: StripeEventLike = {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', metadata: { orderId: 'FL-AB12C3' }, payment_status: 'paid' } },
  }
  const stripe = fakeStripe(async () => event)
  await expect(verifyWebhook(stripe, '{}', 'good-sig', 'whtest')).resolves.toEqual(event)
})

test('dispatchEvent logs the session id, order id and payment status for a completed checkout', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const event: StripeEventLike = {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', metadata: { orderId: 'FL-AB12C3' }, payment_status: 'paid' } },
  }
  dispatchEvent(event)
  expect(logSpy).toHaveBeenCalledWith('checkout.session.completed', 'cs_test_1', 'FL-AB12C3', 'paid')
  logSpy.mockRestore()
})

test('dispatchEvent is a no-op for other event types', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const event: StripeEventLike = {
    id: 'evt_2',
    type: 'payment_intent.succeeded',
    data: { object: { id: 'pi_1' } },
  }
  dispatchEvent(event)
  expect(logSpy).not.toHaveBeenCalled()
  logSpy.mockRestore()
})
