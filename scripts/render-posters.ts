import { mkdirSync, writeFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { PRODUCTS } from '../src/catalog/products'
import { COLLECTIONS } from '../src/catalog/collections'
import { PALETTES } from '../src/catalog/palettes'
import { variantPriceCents } from '../src/catalog/pricing'
import { renderPosterMarkup } from '../src/posters/markup'
import { rasterize } from '../src/posters/rasterize'
import { ogCardMarkup } from '../src/og/OgCard'
import { formatCents } from '../src/lib/money'

const CARD_W = 720
const CARD_MAX = 80 * 1024
const OG_MAX = 300 * 1024
const posters = path.resolve('public/posters')
const og = path.resolve('public/og')
mkdirSync(posters, { recursive: true })
mkdirSync(og, { recursive: true })

function write(file: string, png: Buffer, max: number) {
  writeFileSync(file, png)
  const size = statSync(file).size
  if (size > max) {
    console.error(`render: ${file} is ${size} bytes, over the ${max} budget`)
    process.exit(1)
  }
}

for (const p of PRODUCTS) {
  const palette = PALETTES[p.palettes[0]!]
  write(path.join(posters, `${p.slug}.png`), rasterize(renderPosterMarkup(p, palette), { width: CARD_W }), CARD_MAX)
  const card = ogCardMarkup({
    title: p.name,
    subtitle: COLLECTIONS.find(c => c.slug === p.collection)!.name,
    priceLabel: `from ${formatCents(variantPriceCents(p, 'a3'))}`,
    poster: p,
    palette,
  })
  write(path.join(og, `${p.slug}.png`), rasterize(card, { width: 1200 }), OG_MAX)
}

for (const c of COLLECTIONS) {
  const rep = PRODUCTS.find(p => p.slug === c.representative)!
  write(
    path.join(og, `${c.slug}.png`),
    rasterize(
      ogCardMarkup({ title: c.name, subtitle: 'Collection', priceLabel: '', poster: rep, palette: PALETTES[rep.palettes[0]!] }),
      { width: 1200 },
    ),
    OG_MAX,
  )
}

write(
  path.join(og, 'default.png'),
  rasterize(ogCardMarkup({ title: 'Formline', subtitle: 'Posters made of geometry and type', priceLabel: '' }), { width: 1200 }),
  OG_MAX,
)

console.log(`render: ${PRODUCTS.length} cards, ${PRODUCTS.length + COLLECTIONS.length + 1} OG images`)
