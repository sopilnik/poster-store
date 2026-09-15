import { PRODUCTS } from './products'
import { filterProducts, parseShopQuery, searchProducts, serializeShopQuery, sortProducts } from './query'
test('parseShopQuery ignores junk and defaults', () => {
  expect(parseShopQuery('')).toEqual({ sort: 'default', q: '' })
  expect(parseShopQuery('?collection=night&sort=name&q=Hush')).toEqual({ collection: 'night', sort: 'name', q: 'Hush' })
  expect(parseShopQuery('?collection=nope&sort=up')).toEqual({ sort: 'default', q: '' })
})
test('serializeShopQuery omits defaults', () => {
  expect(serializeShopQuery({ sort: 'default', q: '' })).toBe('')
  expect(serializeShopQuery({ collection: 'night', sort: 'price-asc', q: 'a b' })).toBe('?collection=night&sort=price-asc&q=a+b')
})
test('filter, search and sort', () => {
  expect(filterProducts(PRODUCTS, { collection: 'night', sort: 'default', q: '' })).toHaveLength(4)
  expect(searchProducts(PRODUCTS, 'HUSH').map(p => p.slug)).toEqual(['hush'])
  expect(searchProducts(PRODUCTS, 'grid').length).toBeGreaterThan(1)          // matches tags
  const asc = sortProducts(PRODUCTS, 'price-asc'); expect(asc[0]!.basePriceCents).toBeLessThanOrEqual(asc[15]!.basePriceCents)
  const byName = sortProducts(PRODUCTS, 'name'); expect(byName[0]!.name.localeCompare(byName[1]!.name)).toBeLessThanOrEqual(0)
  expect(sortProducts(PRODUCTS, 'default')).toEqual(PRODUCTS)                 // catalog order, and a new array
})
