import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PosterFrame } from '@/components/product/PosterFrame'
import { ProductGrid } from '@/components/product/ProductGrid'
import { COLLECTIONS } from '@/catalog/collections'
import { PRODUCTS, productBySlug } from '@/catalog/products'
import { PALETTES } from '@/catalog/palettes'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata({
  title: 'Home',
  description: 'Posters made of geometry and type. Sixteen prints across four collections, from a demo storefront.',
  path: '/',
})

const HERO_PRODUCT = productBySlug('red-corner')!
const HERO_PALETTE = PALETTES[HERO_PRODUCT.palettes[0] ?? 'paper']
const FEATURED = PRODUCTS.filter(p => p.featured)

const STEPS = [
  { title: 'Choose a size', description: 'A3, A2 or A1. The same three sizes on every poster.' },
  { title: 'Choose a palette', description: 'Two or three palettes per poster, picked to fit the design.' },
  { title: 'Printed and shipped', description: 'Printed to order and sent out in a plain, sturdy tube.' },
]

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-20">
        <div className="mx-auto w-full max-w-sm">
          <PosterFrame spec={HERO_PRODUCT} palette={HERO_PALETTE} label={HERO_PRODUCT.name} />
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Posters made of geometry and type.</h1>
          <p className="text-muted-foreground">
            Sixteen prints built from shapes, grids and a single bold word each, grouped into four palettes. A demo
            storefront that shows how the shop works without shipping anything real.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" nativeButton={false} render={<Link href="/shop/">Browse the shop</Link>} />
            <Button
              variant="outline"
              size="lg"
              nativeButton={false}
              render={<Link href="/collections/monochrome/">Collections</Link>}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Shop by collection</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {COLLECTIONS.map(c => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}/`}
              className="group block outline-none"
            >
              <div className="aspect-[3/2] overflow-hidden rounded-md border border-border ring-primary ring-offset-2 ring-offset-background group-hover:ring-2 group-focus-visible:ring-2">
                <Image
                  src={`/posters/${c.representative}.png`}
                  width={360}
                  height={509}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <p className="mt-2 font-medium text-foreground">{c.name}</p>
              <p className="text-sm text-muted-foreground">
                {`Collection · ${PRODUCTS.filter(p => p.collection === c.slug).length} posters`}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Featured</h2>
        <ProductGrid products={FEATURED} eager={2} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">How it works</h2>
        <ol className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span className="text-sm font-medium text-primary">{`0${index + 1}`}</span>
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
