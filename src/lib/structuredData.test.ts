import { expect, test } from 'vitest'
import { productJsonLd } from './structuredData'
import { productBySlug } from '../catalog/products'
import { absoluteUrl } from './site'

test('productJsonLd builds a Product node with an AggregateOffer spanning the sizes', () => {
  const product = productBySlug('quiet-hours')
  if (!product) throw new Error('fixture product missing')

  const node = productJsonLd(product)

  expect(node['@context']).toBe('https://schema.org')
  expect(node['@type']).toBe('Product')
  expect(node.name).toBe(product.name)
  expect(node.description).toBe(product.description)
  expect(node.url).toBe(absoluteUrl(`/products/${product.slug}/`))
  expect(node.image).toBe(absoluteUrl(`/og/${product.slug}.png`))
  expect(node.image.startsWith('http')).toBe(true)
  expect(node.offers).toEqual({
    '@type': 'AggregateOffer',
    priceCurrency: 'USD',
    lowPrice: '29.00',
    highPrice: '69.00',
    offerCount: 3,
    availability: 'https://schema.org/InStock',
  })
})
