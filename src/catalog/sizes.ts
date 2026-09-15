import type { Size, SizeId } from './types'

export const SIZES: Size[] = [
  { id: 'a3', label: 'A3', cm: '29.7 × 42 cm', surchargeCents: 0 },
  { id: 'a2', label: 'A2', cm: '42 × 59.4 cm', surchargeCents: 1600 },
  { id: 'a1', label: 'A1', cm: '59.4 × 84.1 cm', surchargeCents: 4000 },
]

export function sizeById(id: SizeId): Size {
  const size = SIZES.find(s => s.id === id)
  if (!size) throw new Error(`Unknown size: ${id}`)
  return size
}

export const FREE_SHIPPING_FROM_CENTS = 15000
export const SHIPPING = { standard: 900, express: 1900 } as const
