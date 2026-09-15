import { variantPriceCents, skuOf, parseSku } from './pricing'
import { productBySlug } from './products'
test('price is base plus size surcharge', () => {
  const p = productBySlug('quiet-hours')!
  expect(variantPriceCents(p, 'a3')).toBe(2900)
  expect(variantPriceCents(p, 'a2')).toBe(4500)
  expect(variantPriceCents(p, 'a1')).toBe(6900)
})
test('sku round-trips and rejects junk', () => {
  const v = { productSlug: 'quiet-hours', sizeId: 'a2' as const, paletteId: 'ink' as const }
  expect(skuOf(v)).toBe('quiet-hours-a2-ink')
  expect(parseSku('quiet-hours-a2-ink')).toEqual(v)
  expect(parseSku('quiet-hours-a2-neon')).toBeNull()      // palette not allowed for this product
  expect(parseSku('nope-a2-ink')).toBeNull()
  expect(parseSku('')).toBeNull()
})
