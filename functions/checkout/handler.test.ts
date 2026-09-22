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

function infiniteBodyRequest(url: string, extraHeaders: Record<string, string> = {}): Request {
  const chunk = new Uint8Array(1024).fill(97)
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      controller.enqueue(chunk)
    },
  })
  return new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...extraHeaders },
    body: stream,
    duplex: 'half',
  } as RequestInit)
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
    headers: { 'content-type': 'application/json' },
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
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...VALID_BODY, items: [{ sku: 'not-a-real-sku-a3-ink', qty: 1 }] }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('POST with qty 0 returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...VALID_BODY, items: [{ sku: 'quiet-hours-a3-ink', qty: 0 }] }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('POST with qty 11 returns 400', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...VALID_BODY, items: [{ sku: 'quiet-hours-a3-ink', qty: 11 }] }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(400)
})

test('POST with a body over 8 KB returns 413, detected by content-length', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': String(9 * 1024) },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with a malformed content-length header returns 413', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': 'not-a-number' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with a hex-disguised content-length header does not bypass the 8 KB limit', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': '0x2000',
    },
    body: JSON.stringify({ ...VALID_BODY, email: `${'a'.repeat(9 * 1024)}@example.com` }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with a negative content-length header returns 413', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': '-1' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with a body over 8 KB returns 413, detected by the actual body size', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...VALID_BODY, email: `${'a'.repeat(9 * 1024)}@example.com` }),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with an endless stream body on the session route returns 413', async () => {
  const request = infiniteBodyRequest('https://api.example.test/checkout/session')
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('POST with an endless stream body on the webhook route returns 413', async () => {
  const request = infiniteBodyRequest('https://api.example.test/stripe/webhook', { 'stripe-signature': 'good-sig' })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(413)
})

test('webhook POST with a body under the 64 KB cap returns 200', async () => {
  const event: StripeEventLike = { id: 'evt_3', type: 'payment_intent.succeeded', data: { object: { id: 'pi_3' } } }
  const request = new Request('https://api.example.test/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'good-sig' },
    body: JSON.stringify({ padding: 'a'.repeat(16 * 1024) }),
  })
  const response = await handle(request, ENV, makeStripeFactory({ constructEventAsync: async () => event }))
  expect(response.status).toBe(200)
})

test('POST with a valid body returns 502 with the error shape and CORS header when create throws', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(
    request,
    ENV,
    makeStripeFactory({
      create: async () => {
        throw new Error('stripe outage')
      },
    })
  )
  expect(response.status).toBe(502)
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4321')
  expect(response.headers.get('content-type')).toBe('application/json')
  await expect(response.json()).resolves.toEqual({ error: 'Could not create a checkout session' })
})

test('POST with a non-JSON content type returns 415 without creating a session', async () => {
  const create = vi.fn(async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.test/s' }))
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory({ create }))
  expect(response.status).toBe(415)
  expect(create).not.toHaveBeenCalled()
})

test('POST with no content type returns 415', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(415)
})

test('POST with a foreign Origin header returns 403 without creating a session', async () => {
  const create = vi.fn(async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.test/s' }))
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://attacker.example' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory({ create }))
  expect(response.status).toBe(403)
  expect(create).not.toHaveBeenCalled()
})

test('POST with the store\'s own Origin header succeeds', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:4321' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(200)
})

test('POST with no Origin header succeeds, keeping curl and the Stripe CLI working', async () => {
  const request = new Request('https://api.example.test/checkout/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(VALID_BODY),
  })
  const response = await handle(request, ENV, makeStripeFactory())
  expect(response.status).toBe(200)
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
