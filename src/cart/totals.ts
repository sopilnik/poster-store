import { PALETTES } from '../catalog/palettes'
import { productBySlug } from '../catalog/products'
import { parseSku, variantPriceCents } from '../catalog/pricing'
import { FREE_SHIPPING_FROM_CENTS, SHIPPING, sizeById } from '../catalog/sizes'
import type { CartItem, DeliveryId, PricedLine } from './types'

export function priceLines(items: CartItem[]): PricedLine[] {
  const lines: PricedLine[] = []
  for (const item of items) {
    const variant = parseSku(item.sku)
    if (!variant) continue
    const product = productBySlug(variant.productSlug)
    if (!product) continue
    const unitCents = variantPriceCents(product, variant.sizeId)
    lines.push({
      sku: item.sku,
      productSlug: variant.productSlug,
      sizeId: variant.sizeId,
      paletteId: variant.paletteId,
      qty: item.qty,
      product,
      unitCents,
      lineCents: unitCents * item.qty,
      palette: PALETTES[variant.paletteId],
      size: sizeById(variant.sizeId),
    })
  }
  return lines
}

export function subtotalCents(lines: PricedLine[]): number {
  return lines.reduce((sum, line) => sum + line.lineCents, 0)
}

export function shippingCents(subtotal: number, delivery: DeliveryId): number {
  if (delivery === 'express') return SHIPPING.express
  return subtotal >= FREE_SHIPPING_FROM_CENTS ? 0 : SHIPPING.standard
}

export function totalCents(subtotal: number, delivery: DeliveryId): number {
  return subtotal + shippingCents(subtotal, delivery)
}

export function unitCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0)
}
