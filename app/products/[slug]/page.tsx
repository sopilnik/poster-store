import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/site/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { ProductOptions } from '@/components/product/ProductOptions'
import { collectionBySlug } from '@/catalog/collections'
import { PRODUCTS, productBySlug } from '@/catalog/products'
import { SIZES } from '@/catalog/sizes'
import { pageMetadata } from '@/lib/metadata'

export function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = productBySlug(slug)
  if (!product) return {}
  return pageMetadata({
    title: product.name,
    description: product.description,
    path: `/products/${product.slug}/`,
    image: `/og/${product.slug}.png`,
  })
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = productBySlug(slug)
  if (!product) notFound()

  const collection = collectionBySlug(product.collection)
  const more = PRODUCTS.filter(p => p.collection === product.collection && p.slug !== product.slug)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumb
        items={[
          { href: '/shop/', label: 'Shop' },
          ...(collection ? [{ href: `/collections/${collection.slug}/`, label: collection.name }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6">
        <ProductOptions product={product} />
      </div>

      <div className="mt-10 max-w-2xl">
        <p className="leading-relaxed">{product.description}</p>
        <h2 className="font-heading mt-6 mb-2 text-lg font-semibold">Print details</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Paper: 200 gsm matte</li>
          <li>Sizes: {SIZES.map(s => `${s.label} (${s.cm})`).join(', ')}</li>
          <li>Free standard shipping from $150.</li>
        </ul>
      </div>

      {collection && more.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading mb-6 text-2xl font-bold tracking-tight">More from {collection.name}</h2>
          <ProductGrid products={more} />
        </div>
      )}
    </div>
  )
}
