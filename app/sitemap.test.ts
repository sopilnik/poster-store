import { expect, test } from 'vitest'
import { PRODUCTS } from '@/catalog/products'
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
