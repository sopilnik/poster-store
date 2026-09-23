import { COLLECTIONS } from '@/catalog/collections'
import { PRODUCTS } from '@/catalog/products'
import { SITE_URL } from '@/lib/siteServer'
import sitemap from './sitemap'

test('the sitemap keeps cart and checkout out and lists the shop and products', () => {
  const urls = sitemap().map(entry => entry.url)
  expect(urls.some(url => url.endsWith('/cart/'))).toBe(false)
  expect(urls.some(url => url.endsWith('/checkout/'))).toBe(false)
  expect(urls.some(url => url.endsWith('/shop/'))).toBe(true)
  for (const product of PRODUCTS) {
    expect(urls.some(url => url.endsWith(`/products/${product.slug}/`))).toBe(true)
  }
})

test('every product and collection slug appears exactly once, as an absolute url', () => {
  const urls = sitemap().map(entry => entry.url)
  for (const url of urls) {
    expect(url.startsWith(SITE_URL)).toBe(true)
  }
  for (const product of PRODUCTS) {
    const matches = urls.filter(url => url.endsWith(`/products/${product.slug}/`))
    expect(matches).toHaveLength(1)
  }
  for (const collection of COLLECTIONS) {
    const matches = urls.filter(url => url.endsWith(`/collections/${collection.slug}/`))
    expect(matches).toHaveLength(1)
  }
})
