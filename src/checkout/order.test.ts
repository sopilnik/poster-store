import { priceLines } from '@/cart/totals'
import type { CartItem } from '@/cart/types'
import { buildOrder, makeOrderId } from './order'
import type { CheckoutInput } from './schema'

test('makeOrderId returns FL- plus six characters from a fixed byte source', () => {
  const id = makeOrderId(() => new Uint8Array([0, 1, 2, 3, 4, 5]))
  expect(id).toBe('FL-ABCDEF')
})

test('makeOrderId wraps bytes past the alphabet length', () => {
  const id = makeOrderId(() => new Uint8Array([35, 36, 71, 72, 255, 0]))
  expect(id).toBe('FL-9A9ADA')
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
  const order = buildOrder(INPUT, twoLines(), '2026-01-01T00:00:00.000Z')
  expect(order.subtotalCents).toBe(9300)
  expect(order.shippingCents).toBe(900)
  expect(order.totalCents).toBe(10200)
})

test('buildOrder totals express shipping', () => {
  const order = buildOrder({ ...INPUT, delivery: 'express' }, twoLines(), '2026-01-01T00:00:00.000Z')
  expect(order.shippingCents).toBe(1900)
  expect(order.totalCents).toBe(9300 + 1900)
})
