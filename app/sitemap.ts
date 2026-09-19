import type { MetadataRoute } from 'next'
import { COLLECTIONS } from '@/catalog/collections'
import { PRODUCTS } from '@/catalog/products'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'

const PATHS = [
  '/',
  '/shop/',
  ...COLLECTIONS.map(c => `/collections/${c.slug}/`),
  ...PRODUCTS.map(p => `/products/${p.slug}/`),
  '/cart/',
  '/checkout/',
]

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map(path => ({ url: absoluteUrl(path) }))
}
