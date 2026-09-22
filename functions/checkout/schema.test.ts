// @vitest-environment node
import { MAX_CART_LINES } from '../../src/checkout/limits'
import { checkoutSessionSchema } from './schema'

const VALID = {
  orderId: 'FL-AB12C3',
  items: [{ sku: 'quiet-hours-a3-ink', qty: 1 }],
  delivery: 'standard',
} as const

test('a valid payload without email passes', () => {
  expect(checkoutSessionSchema.safeParse(VALID).success).toBe(true)
})

test('a valid payload with email passes', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, email: 'buyer@example.com' }).success).toBe(true)
})

test('a malformed order id fails', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, orderId: 'not-an-order-id' }).success).toBe(false)
})

test('an empty items array fails', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, items: [] }).success).toBe(false)
})

test('item lines over the cap fail', () => {
  const items = Array.from({ length: MAX_CART_LINES + 1 }, () => ({ sku: 'quiet-hours-a3-ink', qty: 1 }))
  expect(checkoutSessionSchema.safeParse({ ...VALID, items }).success).toBe(false)
})

test('item lines at the cap pass', () => {
  const items = Array.from({ length: MAX_CART_LINES }, () => ({ sku: 'quiet-hours-a3-ink', qty: 1 }))
  expect(checkoutSessionSchema.safeParse({ ...VALID, items }).success).toBe(true)
})

test('qty 0 fails', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, items: [{ sku: 'quiet-hours-a3-ink', qty: 0 }] }).success).toBe(
    false
  )
})

test('qty 11 fails', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, items: [{ sku: 'quiet-hours-a3-ink', qty: 11 }] }).success).toBe(
    false
  )
})

test('qty 10 passes', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, items: [{ sku: 'quiet-hours-a3-ink', qty: 10 }] }).success).toBe(
    true
  )
})

test('an unknown delivery value fails', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, delivery: 'overnight' }).success).toBe(false)
})

test('an empty email fails', () => {
  expect(checkoutSessionSchema.safeParse({ ...VALID, email: '' }).success).toBe(false)
})
