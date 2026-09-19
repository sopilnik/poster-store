// @vitest-environment node
import { totalCents as computeTotalCents } from '../../src/cart/totals'
import type { Env } from './env'
import { buildLineItems, createSession, getSession, idempotencyKey } from './session'
import type { StripeCreatedSessionLike, StripeLike, StripeRetrievedSessionLike } from './session'

const ENV: Env = {
  STRIPE_SECRET_KEY: 'test-secret',
  STRIPE_WEBHOOK_SECRET: 'test-webhook-secret',
  SITE_URL: 'http://localhost:4321',
}

function fakeStripe(overrides: Partial<StripeLike> = {}): StripeLike & { calls: { create: unknown[] } } {
  const calls = { create: [] as unknown[] }
  const created: StripeCreatedSessionLike = { id: 'cs_test_1', url: 'https://checkout.stripe.test/s' }
  const retrieved: StripeRetrievedSessionLike = {
    id: 'cs_test_1',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 3800,
    currency: 'usd',
    metadata: { orderId: 'FL-AB12C3' },
  }
  return {
    calls,
    checkout: {
      sessions: {
        create: async (params, options) => {
          calls.create.push({ params, options })
          return created
        },
        retrieve: async () => retrieved,
      },
    },
    webhooks: {
      constructEventAsync: async () => {
        throw new Error('bad signature')
      },
    },
    ...overrides,
  }
}

const CART_BELOW_FREE_SHIPPING = { items: [{ sku: 'quiet-hours-a3-ink', qty: 1 }], delivery: 'standard' as const }
const CART_ABOVE_FREE_SHIPPING = {
  items: [
    { sku: 'quiet-hours-a1-ink', qty: 2 },
    { sku: 'low-tide-a2-ink', qty: 1 },
  ],
  delivery: 'standard' as const,
}
const CART_EXPRESS = { items: [{ sku: 'ninety-six-a2-paper', qty: 3 }], delivery: 'express' as const }

for (const cart of [CART_BELOW_FREE_SHIPPING, CART_ABOVE_FREE_SHIPPING, CART_EXPRESS]) {
  test(`buildLineItems totals match totalCents for ${cart.items.map(i => i.sku).join(',')}`, () => {
    const result = buildLineItems(cart.items, cart.delivery, ENV.SITE_URL)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const lineItemsTotal = result.lineItems.reduce(
      (sum, item) => sum + item.price_data.unit_amount * item.quantity,
      0
    )
    const shippingTotal = result.shippingOptions.reduce(
      (sum, option) => sum + option.shipping_rate_data.fixed_amount.amount,
      0
    )
    expect(lineItemsTotal + shippingTotal).toBe(computeTotalCents(lineItemsTotal, cart.delivery))
    expect(result.totalCents).toBe(lineItemsTotal + shippingTotal)
  })
}

test('buildLineItems returns the free-shipping amount for the above-threshold cart', () => {
  const result = buildLineItems(CART_ABOVE_FREE_SHIPPING.items, CART_ABOVE_FREE_SHIPPING.delivery, ENV.SITE_URL)
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.shippingOptions[0]?.shipping_rate_data.fixed_amount.amount).toBe(0)
  expect(result.totalCents).toBe(18500)
})

test('buildLineItems returns the express amount regardless of subtotal', () => {
  const result = buildLineItems(CART_EXPRESS.items, CART_EXPRESS.delivery, ENV.SITE_URL)
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.shippingOptions[0]?.shipping_rate_data.fixed_amount.amount).toBe(1900)
  expect(result.totalCents).toBe(14500)
})

test('buildLineItems fails on an unknown sku', () => {
  const result = buildLineItems([{ sku: 'not-a-real-sku-a3-ink', qty: 1 }], 'standard', ENV.SITE_URL)
  expect(result).toEqual({ ok: false, sku: 'not-a-real-sku-a3-ink' })
})

test('buildLineItems includes no product image over http', () => {
  const result = buildLineItems(CART_BELOW_FREE_SHIPPING.items, 'standard', 'http://localhost:4321')
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.lineItems[0]?.price_data.product_data.images).toBeUndefined()
})

test('buildLineItems includes the product image over https', () => {
  const result = buildLineItems(CART_BELOW_FREE_SHIPPING.items, 'standard', 'https://example.test')
  expect(result.ok).toBe(true)
  if (!result.ok) return
  expect(result.lineItems[0]?.price_data.product_data.images).toEqual([
    'https://example.test/posters/quiet-hours.png',
  ])
})

test('idempotencyKey is stable for the same order', async () => {
  const a = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard')
  const b = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard')
  expect(a).toBe(b)
})

test('idempotencyKey changes when an item changes', async () => {
  const a = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard')
  const b = await idempotencyKey('FL-AB12C3', [{ sku: 'quiet-hours-a3-ink', qty: 2 }], 'standard')
  expect(a).not.toBe(b)
})

test('idempotencyKey does not depend on item order', async () => {
  const a = await idempotencyKey('FL-AB12C3', CART_ABOVE_FREE_SHIPPING.items, 'standard')
  const b = await idempotencyKey('FL-AB12C3', [...CART_ABOVE_FREE_SHIPPING.items].reverse(), 'standard')
  expect(a).toBe(b)
})

test('idempotencyKey changes when only the email differs on an otherwise identical order', async () => {
  const a = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard', 'buyer@example.com')
  const b = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard', 'other@example.com')
  expect(a).not.toBe(b)
})

test('idempotencyKey differs between no email and an empty email', async () => {
  const a = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard')
  const b = await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard', 'buyer@example.com')
  expect(a).not.toBe(b)
})

test('createSession sends the total as line items plus one shipping option and passes an idempotency key', async () => {
  const stripe = fakeStripe()
  const result = await createSession(
    stripe,
    { orderId: 'FL-AB12C3', items: CART_BELOW_FREE_SHIPPING.items, delivery: 'standard' },
    ENV
  )
  expect(result).toEqual({ ok: true, url: 'https://checkout.stripe.test/s', id: 'cs_test_1' })
  expect(stripe.calls.create).toHaveLength(1)
  const call = stripe.calls.create[0] as { params: import('./session').CheckoutSessionParams; options: { idempotencyKey: string } }
  expect(call.params.mode).toBe('payment')
  expect(call.params.line_items).toHaveLength(1)
  expect(call.params.shipping_options).toHaveLength(1)
  expect(call.params.success_url).toBe('http://localhost:4321/checkout/success/?session_id={CHECKOUT_SESSION_ID}')
  expect(call.params.cancel_url).toBe('http://localhost:4321/checkout/')
  expect(call.params.metadata).toEqual({ orderId: 'FL-AB12C3' })
  expect(call.params.customer_email).toBeUndefined()
  expect(call.options.idempotencyKey).toBe(await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard'))
})

test('createSession sets customer_email only when an email is given', async () => {
  const stripe = fakeStripe()
  await createSession(
    stripe,
    { orderId: 'FL-AB12C3', items: CART_BELOW_FREE_SHIPPING.items, delivery: 'standard', email: 'buyer@example.com' },
    ENV
  )
  const call = stripe.calls.create[0] as {
    params: import('./session').CheckoutSessionParams
    options: { idempotencyKey: string }
  }
  expect(call.params.customer_email).toBe('buyer@example.com')
  expect(call.options.idempotencyKey).toBe(
    await idempotencyKey('FL-AB12C3', CART_BELOW_FREE_SHIPPING.items, 'standard', 'buyer@example.com')
  )
})

test('createSession rejects an unknown sku without calling stripe', async () => {
  const stripe = fakeStripe()
  const result = await createSession(
    stripe,
    { orderId: 'FL-AB12C3', items: [{ sku: 'not-a-real-sku-a3-ink', qty: 1 }], delivery: 'standard' },
    ENV
  )
  expect(result).toEqual({ ok: false, status: 400, error: 'Unknown SKU: not-a-real-sku-a3-ink' })
  expect(stripe.calls.create).toHaveLength(0)
})

test('createSession returns 502 when stripe.checkout.sessions.create throws', async () => {
  const stripe = fakeStripe({
    checkout: {
      sessions: {
        create: async () => {
          throw new Error('stripe outage')
        },
        retrieve: async () => {
          throw new Error('unused')
        },
      },
    },
  })
  const result = await createSession(
    stripe,
    { orderId: 'FL-AB12C3', items: CART_BELOW_FREE_SHIPPING.items, delivery: 'standard' },
    ENV
  )
  expect(result).toEqual({ ok: false, status: 502, error: 'Could not create a checkout session' })
})

test('getSession rejects an id not starting with cs_', async () => {
  const stripe = fakeStripe()
  const result = await getSession(stripe, 'evt_not_a_session')
  expect(result).toEqual({ ok: false, status: 400, error: 'Invalid session id' })
})

test('getSession rejects an over-long id without calling stripe', async () => {
  const stripe = fakeStripe()
  const result = await getSession(stripe, `cs_${'a'.repeat(5 * 1024)}`)
  expect(result).toEqual({ ok: false, status: 400, error: 'Invalid session id' })
  expect(stripe.calls.create).toHaveLength(0)
})

test('getSession rejects an id with characters outside the allowed shape', async () => {
  const stripe = fakeStripe()
  const result = await getSession(stripe, 'cs_test_1; DROP TABLE sessions')
  expect(result).toEqual({ ok: false, status: 400, error: 'Invalid session id' })
})

test('getSession strips address and email, keeping only status fields', async () => {
  const stripe = fakeStripe()
  const result = await getSession(stripe, 'cs_test_1')
  expect(result).toEqual({
    ok: true,
    body: {
      id: 'cs_test_1',
      status: 'complete',
      payment_status: 'paid',
      amount_total: 3800,
      currency: 'usd',
      orderId: 'FL-AB12C3',
    },
  })
})

test('getSession returns 404 when the retrieve call throws', async () => {
  const stripe = fakeStripe({
    checkout: {
      sessions: {
        create: async () => ({ id: 'cs_test_1', url: 'https://checkout.stripe.test/s' }),
        retrieve: async () => {
          throw new Error('no such session')
        },
      },
    },
  })
  const result = await getSession(stripe, 'cs_missing')
  expect(result).toEqual({ ok: false, status: 404, error: 'Session not found' })
})
