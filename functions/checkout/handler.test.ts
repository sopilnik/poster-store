// @vitest-environment node
import type { Env } from './env'
import { handle } from './handler'
import type { StripeCreatedSessionLike, StripeEventLike, StripeLike, StripeRetrievedSessionLike } from './session'

const ENV: Env = {
  STRIPE_SECRET_KEY: 'test-secret',
  STRIPE_WEBHOOK_SECRET: 'test-webhook-secret',
  SITE_URL: 'http://localhost:4321',
}

const VALID_BODY = {
  orderId: 'FL-AB12C3',
  items: [{ sku: 'quiet-hours-a3-ink', qty: 1 }],
  delivery: 'standard',
}

type FakeStripeOptions = {
  create?: () => Promise<StripeCreatedSessionLike>
  retrieve?: () => Promise<StripeRetrievedSessionLike>
  constructEventAsync?: () => Promise<StripeEventLike>
}

function makeStripeFactory(options: FakeStripeOptions = {}): (key: string) => StripeLike {
  return () => ({
    checkout: {
      sessions: {
        create: options.create ?? (async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.test/s' })),
        retrieve:
          options.retrieve ??
          (async () => ({
            id: 'cs_test_1',
            status: 'complete',
            payment_status: 'paid',
            amount_total: 3800,
            currency: 'usd',
            metadata: { orderId: 'FL-AB12C3' },
          })),
      },
    },
    webhooks: {
      constructEventAsync:
        options.constructEventAsync ??
        (async () => {
          throw new Error('bad signature')
        }),
    },
  })
}

test('OPTIONS on the session route returns 204 with CORS headers for a cross-origin function', async () => {
  const request = new Request('https://api.example.test/checkout/session', { method: 'OPTIONS' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(204)
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4321')
  expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, GET, OPTIONS')
})

test('no CORS headers when the function shares the store origin', async () => {
  const request = new Request('http://localhost:4321/checkout/session', { method: 'OPTIONS' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
})

test('POST with a valid body returns 200 and the session url', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(200)
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(response.headers.get('content-type')).toBe('application/json')
  await expect(response.json()).resolves.toEqual({ url: 'https://checkout.stripe.test/s', id: 'cs_test_1' })
})

test('POST with an unknown sku returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ ...VALID_BODY, items: [{ sku: 'not-a-real-sku-a3-ink', qty: 1 }] }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('POST with qty 0 returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ ...VALID_BODY, items: [{ sku: 'quiet-hours-a3-ink', qty: 0 }] }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('POST with qty 11 returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ ...VALID_BODY, items: [{ sku: 'quiet-hours-a3-ink', qty: 11 }] }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('POST with a body over 8 KB returns 413, detected by content-length', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-length': String(9 * 1024) },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with a body over 8 KB returns 413, detected by the actual body size', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ ...VALID_BODY, email: `${'a'.repeat(9 * 1024)}@example.com` }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('GET with a valid session id returns the stripped status body', async () => {
  const request = new Request('https://api.example.test/checkout/session?id=cs_test_1', { method: 'GET' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(200)
  await expect(response.json()).resolves.toEqual({
    id: 'cs_test_1',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 3800,
    currency: 'usd',
    orderId: 'FL-AB12C3',
  })
})

test('GET with an id not starting with cs_ returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session?id=evt_not_a_session', { method: 'GET' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('GET with no id returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session', { method: 'GET' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('an unknown path returns 404', async () => {
  const request = new Request('https://api.example.test/checkout/nope', { method: 'GET' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(404)
})

test('an unsupported method on the session route returns 405', async () => {
  const request = new Request('https://api.example.test/checkout/session', { method: 'DELETE' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(405)
})

test('webhook POST with a bad signature returns 400', async () => {
  const request = new Request('https://api.example.test/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'bad-sig' },
    body: '{}',
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('webhook POST with no signature header returns 400', async () => {
  const request = new Request('https://api.example.test/stripe/webhook', { method: 'POST', body: '{}' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('webhook POST with a verified checkout.session.completed event returns 200 and logs', async () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const event: StripeEventLike = {
    id: 'evt_1',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', metadata: { orderId: 'FL-AB12C3' }, payment_status: 'paid' } },
  }
  const request = new Request('https://api.example.test/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'good-sig' },
    body: '{}',
  })
  const response = await handle(request, ENV, makeStripeFactory({ constructEventAsync: async () => event }))
  expect(response.status).toBe(200)
  expect(logSpy).toHaveBeenCalledWith('checkout.session.completed', 'cs_test_1', 'FL-AB12C3', 'paid')
  logSpy.mockRestore()
})

test('webhook POST with an unhandled event type still returns 200', async () => {
  const event: StripeEventLike = { id: 'evt_2', type: 'payment_intent.succeeded', data: { object: { id: 'pi_1' } } }
  const request = new Request('https://api.example.test/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'good-sig' },
    body: '{}',
  })
  const response = await handle(request, ENV, makeStripeFactory({ constructEventAsync: async () => event }))
  expect(response.status).toBe(200)
})

test('a GET on the webhook route returns 405', async () => {
  const request = new Request('https://api.example.test/stripe/webhook', { method: 'GET' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(405)
})
