import { notFound } from 'next/navigation'
import { Breadcrumb } from '@/components/site/Breadcrumb'
import { ProductGrid } from '@/components/product/ProductGrid'
import { COLLECTIONS, collectionBySlug } from '@/catalog/collections'
import { PRODUCTS } from '@/catalog/products'
import { pageMetadata } from '@/lib/metadata'

export function generateStaticParams() {
  return COLLECTIONS.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = collectionBySlug(slug)
  if (!collection) return {}
  return pageMetadata({
    title: collection.name,
    description: collection.description,
    path: `/collections/${collection.slug}/`,
    image: `/og/${collection.slug}.png`,
  })
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const collection = collectionBySlug(slug)
  if (!collection) notFound()

  const products = PRODUCTS.filter(p => p.collection === collection.slug)

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Breadcrumb items={[{ href: '/shop/', label: 'Shop' }, { label: collection.name }]} />
      <h1 className="font-heading mt-4 mb-2 text-2xl font-bold tracking-tight">{collection.name}</h1>
      <p className="mb-8 max-w-2xl text-muted-foreground">{collection.description}</p>
      <ProductGrid products={products} eager={2} />
    </div>
  )
}
