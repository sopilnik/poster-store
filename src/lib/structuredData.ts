import type { Product } from '@/catalog/types'
import { SIZES } from '@/catalog/sizes'
import { variantPriceCents } from '@/catalog/pricing'
import { absoluteUrl } from './siteServer'

const formatUsd = (cents: number): string => (cents / 100).toFixed(2)

export function productJsonLd(product: Product) {
  const prices = SIZES.map(s => variantPriceCents(product, s.id))
  const lowPrice = formatUsd(Math.min(...prices))
  const highPrice = formatUsd(Math.max(...prices))

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    url: absoluteUrl(`/products/${product.slug}/`),
    image: absoluteUrl(`/og/${product.slug}.png`),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice,
      highPrice,
      offerCount: SIZES.length,
      availability: 'https://schema.org/InStock',
    },
  }
}
