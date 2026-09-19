import { skuOf } from '../catalog/pricing'
import type { CartAction, CartState } from './types'

export const MAX_QTY = 10

function clampQty(qty: number): number {
  return Math.min(MAX_QTY, Math.max(1, qty))
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const sku = skuOf(action.variant)
      const qty = clampQty(action.qty ?? 1)
      const existing = state.items.find(item => item.sku === sku)
      if (existing) {
        return {
          items: state.items.map(item =>
            item.sku === sku ? { ...item, qty: clampQty(item.qty + qty) } : item
          ),
        }
      }
      return {
        items: [
          ...state.items,
          {
            sku,
            productSlug: action.variant.productSlug,
            sizeId: action.variant.sizeId,
            paletteId: action.variant.paletteId,
            qty,
          },
        ],
      }
    }
    case 'remove':
      return { items: state.items.filter(item => item.sku !== action.sku) }
    case 'setQty':
      return {
        items: state.items.map(item =>
          item.sku === action.sku ? { ...item, qty: clampQty(action.qty) } : item
        ),
      }
    case 'clear':
      return { items: [] }
    case 'replace':
      return { items: action.items }
  }
}
