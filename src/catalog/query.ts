import type { CollectionSlug, Product } from './types'
import { collectionBySlug } from './collections'

export type SortId = 'default' | 'price-asc' | 'price-desc' | 'name'
export type ShopQuery = { collection?: CollectionSlug; sort: SortId; q: string }

const SORT_IDS: SortId[] = ['default', 'price-asc', 'price-desc', 'name']

function isSortId(x: string): x is SortId {
  return SORT_IDS.some(id => id === x)
}

export function parseShopQuery(search: string): ShopQuery {
  const params = new URLSearchParams(search)
  const collectionParam = params.get('collection')
  const sortParam = params.get('sort')
  const qParam = params.get('q')
  const collection = collectionParam ? collectionBySlug(collectionParam)?.slug : undefined
  const sort = sortParam && isSortId(sortParam) ? sortParam : 'default'
  const q = (qParam ?? '').trim()
  return collection ? { collection, sort, q } : { sort, q }
}

export function serializeShopQuery(q: ShopQuery): string {
  const params = new URLSearchParams()
  if (q.collection) params.set('collection', q.collection)
  if (q.sort !== 'default') params.set('sort', q.sort)
  const trimmedQ = q.q.trim()
  if (trimmedQ) params.set('q', trimmedQ)
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export function searchProducts(products: Product[], q: string): Product[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return [...products]
  return products.filter(p => p.name.toLowerCase().includes(needle) || p.tags.some(tag => tag.toLowerCase().includes(needle)))
}

export function sortProducts(products: Product[], sort: SortId): Product[] {
  const copy = [...products]
  if (sort === 'price-asc') return copy.sort((a, b) => a.basePriceCents - b.basePriceCents)
  if (sort === 'price-desc') return copy.sort((a, b) => b.basePriceCents - a.basePriceCents)
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name))
  return copy
}

export function filterProducts(products: Product[], q: ShopQuery): Product[] {
  const byCollection = q.collection ? products.filter(p => p.collection === q.collection) : products
  return sortProducts(searchProducts(byCollection, q.q), q.sort)
}
