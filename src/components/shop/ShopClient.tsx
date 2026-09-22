'use client'

import { useEffect, useRef, useState } from 'react'
import { COLLECTIONS, collectionBySlug } from '@/catalog/collections'
import { filterProducts, parseShopQuery, serializeShopQuery } from '@/catalog/query'
import type { ShopQuery, SortId } from '@/catalog/query'
import type { CollectionSlug, Product } from '@/catalog/types'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMounted } from '@/hooks/useMounted'

const SEARCH_DEBOUNCE_MS = 150

const COLLECTION_ITEMS: { label: string; value: string }[] = [
  { label: 'All collections', value: 'all' },
  ...COLLECTIONS.map(c => ({ label: c.name, value: c.slug })),
]

const SORT_ITEMS: { label: string; value: SortId }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Name', value: 'name' },
]

function isCollectionSlug(value: string): value is CollectionSlug {
  return COLLECTIONS.some(c => c.slug === value)
}

export function ShopClient({ products }: { products: Product[] }) {
  const mounted = useMounted()
  const [query, setQuery] = useState<ShopQuery>(() => parseShopQuery(''))
  const [searchText, setSearchText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function sync() {
      const next = parseShopQuery(window.location.search)
      setQuery(next)
      setSearchText(next.q)
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      clearPending()
    }
  }, [])

  function clearPending() {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = null
  }

  function update(next: ShopQuery) {
    setQuery(next)
    window.history.replaceState(null, '', window.location.pathname + serializeShopQuery(next))
  }

  function handleSearchChange(value: string) {
    setSearchText(value)
    clearPending()
    debounceRef.current = setTimeout(() => {
      update({ ...query, q: value })
    }, SEARCH_DEBOUNCE_MS)
  }

  function handleCollectionChange(value: string) {
    clearPending()
    if (value === 'all') {
      update({ sort: query.sort, q: searchText })
      return
    }
    if (isCollectionSlug(value)) update({ ...query, q: searchText, collection: value })
  }

  function handleSortChange(value: SortId) {
    clearPending()
    update({ ...query, q: searchText, sort: value })
  }

  function handleClear() {
    clearPending()
    setSearchText('')
    update({ sort: 'default', q: '' })
  }

  const results = mounted ? filterProducts(products, query) : products
  const count = results.length
  const heading = query.collection ? collectionBySlug(query.collection)?.name : 'All posters'

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-heading mb-6 text-2xl font-bold tracking-tight">{heading}</h1>

      {mounted && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Input
            type="search"
            aria-label="Search posters"
            placeholder="Search posters"
            value={searchText}
            onChange={e => handleSearchChange(e.target.value)}
            className="max-w-56"
          />
          <Select
            items={COLLECTION_ITEMS}
            value={query.collection ?? 'all'}
            onValueChange={value => {
              if (typeof value === 'string') handleCollectionChange(value)
            }}
          >
            <SelectTrigger aria-label="Collection">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_ITEMS.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={SORT_ITEMS}
            value={query.sort}
            onValueChange={value => {
              if (typeof value === 'string') handleSortChange(value as SortId)
            }}
          >
            <SelectTrigger aria-label="Sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_ITEMS.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleClear}>
            Clear filters
          </Button>
        </div>
      )}

      <p aria-live="polite" className="mb-6 text-sm text-muted-foreground">
        {count} poster{count === 1 ? '' : 's'}
      </p>

      {mounted && count === 0 ? (
        <p className="text-muted-foreground">Nothing matches. Try another word or clear the filters.</p>
      ) : (
        <ProductGrid products={results} eager={4} />
      )}
    </div>
  )
}
