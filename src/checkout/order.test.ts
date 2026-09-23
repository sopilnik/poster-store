import { priceLines } from '@/cart/totals'
import type { CartItem } from '@/cart/types'
import { buildOrder, makeOrderId } from './order'
import type { CheckoutInput } from './schema'

test('makeOrderId returns FL- plus six characters from a fixed byte source', () => {
  const id = makeOrderId(() => new Uint8Array([0, 1, 2, 3, 4, 5]))
  expect(id).toBe('FL-ABCDEF')
})

test('makeOrderId skips a byte at or above 252 and draws again', () => {
  const id = makeOrderId(() => new Uint8Array([35, 36, 71, 72, 255, 0]))
  expect(id).toBe('FL-9A9AA9')
})

test('makeOrderId retries a source that returns only biased bytes', () => {
  let calls = 0
  const source = () => {
    calls += 1
    return calls === 1 ? new Uint8Array(12).fill(255) : new Uint8Array([0, 1, 2, 3, 4, 5])
  }
  const id = makeOrderId(source)
  expect(id).toBe('FL-ABCDEF')
  expect(calls).toBe(2)
})

const INPUT: CheckoutInput = {
  email: 'buyer@example.com',
  fullName: 'Jordan Rivers',
  address: '221B Baker Street',
  city: 'London',
  postalCode: 'NW1 6XE',
  country: 'United Kingdom',
  delivery: 'standard',
  payment: 'demo',
}

function twoLines() {
  const items: CartItem[] = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
    { sku: 'sixteen-lines-a3-ink', productSlug: 'sixteen-lines', sizeId: 'a3', paletteId: 'ink', qty: 2 },
  ]
  return priceLines(items)
}

test('buildOrder totals standard shipping', () => {
  const now = '2026-01-01T00:00:00.000Z'
  const lines = twoLines()
  const order = buildOrder(INPUT, lines, now)
  expect(order.subtotalCents).toBe(9300)
  expect(order.shippingCents).toBe(900)
  expect(order.totalCents).toBe(10200)
  expect(order).toMatchObject({
    createdAt: now,
    delivery: 'standard',
    address: {
      email: INPUT.email,
      fullName: INPUT.fullName,
      address: INPUT.address,
      city: INPUT.city,
      postalCode: INPUT.postalCode,
      country: INPUT.country,
    },
  })
  expect(order.address).not.toHaveProperty('payment')
  expect(order.items).toEqual(lines)
})

test('buildOrder totals express shipping', () => {
  const order = buildOrder({ ...INPUT, delivery: 'express' }, twoLines(), '2026-01-01T00:00:00.000Z')
  expect(order.shippingCents).toBe(1900)
  expect(order.totalCents).toBe(9300 + 1900)
})
