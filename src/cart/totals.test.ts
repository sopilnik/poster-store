import { priceLines, shippingCents, subtotalCents, totalCents, unitCount } from './totals'
import type { CartItem } from './types'

test('priceLines prices a known sku and drops one whose sku does not parse', () => {
  const items: CartItem[] = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
    { sku: 'nope-a2-ink', productSlug: 'nope', sizeId: 'a2', paletteId: 'ink', qty: 1 },
  ]
  const lines = priceLines(items)
  expect(lines).toHaveLength(1)
  expect(lines[0]?.unitCents).toBe(4500)
})

test('subtotalCents sums the line totals', () => {
  const lines = priceLines([
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 2 },
  ])
  expect(subtotalCents(lines)).toBe(9000)
})

test('shippingCents follows the free-shipping threshold and the express flat rate', () => {
  expect(shippingCents(14999, 'standard')).toBe(900)
  expect(shippingCents(15000, 'standard')).toBe(0)
  expect(shippingCents(15000, 'express')).toBe(1900)
})

test('totalCents adds shipping to the subtotal', () => {
  expect(totalCents(14999, 'standard')).toBe(14999 + 900)
  expect(totalCents(15000, 'standard')).toBe(15000)
  expect(totalCents(15000, 'express')).toBe(15000 + 1900)
})

test('unitCount sums quantities across items', () => {
  const items: CartItem[] = [
    { sku: 'a', productSlug: 'a', sizeId: 'a3', paletteId: 'ink', qty: 2 },
    { sku: 'b', productSlug: 'b', sizeId: 'a3', paletteId: 'ink', qty: 3 },
  ]
  expect(unitCount(items)).toBe(5)
})
