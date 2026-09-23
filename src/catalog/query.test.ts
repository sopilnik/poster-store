import { PRODUCTS } from './products'
import { filterProducts, parseShopQuery, searchProducts, serializeShopQuery, sortProducts } from './query'
test('parseShopQuery ignores junk and defaults', () => {
  expect(parseShopQuery('')).toEqual({ sort: 'default', q: '' })
  expect(parseShopQuery('?collection=night&sort=name&q=Hush')).toEqual({ collection: 'night', sort: 'name', q: 'Hush' })
  expect(parseShopQuery('?collection=nope&sort=up')).toEqual({ sort: 'default', q: '' })
  expect(parseShopQuery(`?q=${'a'.repeat(150)}`).q).toHaveLength(100)
})
test('serializeShopQuery omits defaults', () => {
  expect(serializeShopQuery({ sort: 'default', q: '' })).toBe('')
  expect(serializeShopQuery({ collection: 'night', sort: 'price-asc', q: 'a b' })).toBe('?collection=night&sort=price-asc&q=a+b')
})
test('filter, search and sort', () => {
  expect(filterProducts(PRODUCTS, { collection: 'night', sort: 'default', q: '' })).toHaveLength(4)
  expect(searchProducts(PRODUCTS, 'HUSH').map(p => p.slug)).toEqual(['hush'])
  expect(searchProducts(PRODUCTS, 'grid').length).toBeGreaterThan(1)          // matches tags
  const prices = PRODUCTS.map(p => p.basePriceCents)
  expect(sortProducts(PRODUCTS, 'price-asc').map(p => p.basePriceCents)).toEqual([...prices].sort((a, b) => a - b))
  expect(sortProducts(PRODUCTS, 'price-desc').map(p => p.basePriceCents)).toEqual([...prices].sort((a, b) => b - a))
  const names = PRODUCTS.map(p => p.name)
  expect(sortProducts(PRODUCTS, 'name').map(p => p.name)).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  const byDefault = sortProducts(PRODUCTS, 'default')
  expect(byDefault).toEqual(PRODUCTS); expect(byDefault).not.toBe(PRODUCTS)  // catalog order, and a new array
})
test('searchProducts with an empty needle returns a copy', () => {
  const out = searchProducts(PRODUCTS, '')
  expect(out).toEqual(PRODUCTS); expect(out).not.toBe(PRODUCTS)
})
test('serializeShopQuery trims and drops a blank q', () => {
  expect(serializeShopQuery({ sort: 'default', q: '   ' })).toBe('')
  expect(serializeShopQuery({ sort: 'default', q: ' hush ' })).toBe('?q=hush')
})
