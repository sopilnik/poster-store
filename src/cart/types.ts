import type { Palette, PaletteId } from '../posters/types'
import type { Product, Size, SizeId, Variant } from '../catalog/types'

export type CartItem = { sku: string; productSlug: string; sizeId: SizeId; paletteId: PaletteId; qty: number }
export type CartState = { items: CartItem[] }
export type CartAction =
  | { type: 'add'; variant: Variant; qty?: number }
  | { type: 'remove'; sku: string }
  | { type: 'setQty'; sku: string; qty: number }
  | { type: 'clear' }
  | { type: 'replace'; items: CartItem[] }

export type DeliveryId = 'standard' | 'express'

export type PricedLine = CartItem & {
  product: Product
  unitCents: number
  lineCents: number
  palette: Palette
  size: Size
}

export type CartContextValue = {
  items: CartItem[]
  hydrated: boolean
  isOpen: boolean
  open(): void
  close(): void
  dispatch(action: CartAction): void
}
