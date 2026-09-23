import { PRODUCTS, productBySlug, requireProduct } from './products'
import { COLLECTIONS } from './collections'
import { PALETTES } from './palettes'
test('sixteen products, four per collection, unique slugs', () => {
  expect(PRODUCTS).toHaveLength(16)
  for (const c of COLLECTIONS) expect(PRODUCTS.filter(p => p.collection === c.slug)).toHaveLength(4)
  expect(new Set(PRODUCTS.map(p => p.slug)).size).toBe(16)
})
test('every product has 2-4 known palettes, a base price in range and a template', () => {
  for (const p of PRODUCTS) {
    expect(p.palettes.length).toBeGreaterThanOrEqual(2); expect(p.palettes.length).toBeLessThanOrEqual(4)
    for (const id of p.palettes) expect(PALETTES[id]).toBeDefined()
    expect(p.basePriceCents).toBeGreaterThanOrEqual(2400); expect(p.basePriceCents).toBeLessThanOrEqual(3900)
    expect(['typographic', 'grid', 'stripes', 'orbit', 'blocks']).toContain(p.template)
  }
})
test('six featured, each collection mixes at least three templates, representatives exist', () => {
  expect(PRODUCTS.filter(p => p.featured)).toHaveLength(6)
  for (const c of COLLECTIONS) {
    expect(new Set(PRODUCTS.filter(p => p.collection === c.slug).map(p => p.template)).size).toBeGreaterThanOrEqual(3)
    expect(productBySlug(c.representative)?.collection).toBe(c.slug)
  }
})
test('requireProduct returns the hero product and throws on an unknown slug', () => {
  expect(requireProduct('red-corner').slug).toBe('red-corner')
  expect(() => requireProduct('nope')).toThrow('Unknown product slug: nope')
})
