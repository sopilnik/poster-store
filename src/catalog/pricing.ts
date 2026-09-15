import type { PaletteId } from '../posters/types'
import type { Product, SizeId, Variant } from './types'
import { productBySlug } from './products'
import { sizeById } from './sizes'

export function variantPriceCents(p: Product, sizeId: SizeId): number {
  return p.basePriceCents + sizeById(sizeId).surchargeCents
}

export function skuOf(v: Variant): string {
  return `${v.productSlug}-${v.sizeId}-${v.paletteId}`
}

function isSizeId(x: string): x is SizeId {
  return x === 'a3' || x === 'a2' || x === 'a1'
}

function isPaletteOfProduct(p: Product, x: string): x is PaletteId {
  return p.palettes.some(id => id === x)
}

export function parseSku(sku: string): Variant | null {
  const m = /^(.+)-(a3|a2|a1)-([a-z]+)$/.exec(sku)
  if (!m) return null
  const productSlug = m[1]
  const sizeId = m[2]
  const paletteId = m[3]
  if (!productSlug || !sizeId || !paletteId || !isSizeId(sizeId)) return null
  const p = productBySlug(productSlug)
  if (!p || !isPaletteOfProduct(p, paletteId)) return null
  return { productSlug, sizeId, paletteId }
}
