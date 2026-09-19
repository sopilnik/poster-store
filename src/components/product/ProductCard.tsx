import Link from 'next/link'
import { collectionBySlug } from '@/catalog/collections'
import { variantPriceCents } from '@/catalog/pricing'
import { formatCents } from '@/lib/money'
import type { Product } from '@/catalog/types'

export function ProductCard({ product, eager = false }: { product: Product; eager?: boolean }) {
  const collection = collectionBySlug(product.collection)
  return (
    <Link
      href={`/products/${product.slug}/`}
      className="group block rounded-md outline-none ring-primary ring-offset-2 hover:ring-2 focus-visible:ring-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/posters/${product.slug}.png`}
        width={360}
        height={509}
        alt={product.name}
        loading={eager ? 'eager' : 'lazy'}
        className="w-full rounded-md border border-border"
      />
      <div className="mt-2">
        <p className="font-medium text-foreground">{product.name}</p>
        {collection ? <p className="text-sm text-muted-foreground">{collection.name}</p> : null}
        <p className="text-sm text-muted-foreground">from {formatCents(variantPriceCents(product, 'a3'))}</p>
      </div>
    </Link>
  )
}
