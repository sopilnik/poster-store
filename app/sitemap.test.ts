import { expect, test } from 'vitest'
import sitemap from './sitemap'

test('the sitemap keeps cart and checkout out and lists the shop and products', () => {
  const urls = sitemap().map(entry => entry.url)
  expect(urls.some(url => url.endsWith('/cart/'))).toBe(false)
  expect(urls.some(url => url.endsWith('/checkout/'))).toBe(false)
  expect(urls.some(url => url.endsWith('/shop/'))).toBe(true)
  expect(urls.filter(url => /\/products\/[^/]+\/$/.test(url)).length).toBeGreaterThan(0)
})
