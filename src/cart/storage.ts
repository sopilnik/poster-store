import { parseSku } from '../catalog/pricing'
import { MAX_QTY } from './reducer'
import type { CartItem } from './types'

export const CART_KEY = 'formline.cart.v1'

function clampQty(qty: number): number {
  return Math.min(MAX_QTY, Math.max(1, qty))
}

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const items: CartItem[] = []
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue
      const sku = (entry as { sku?: unknown }).sku
      if (typeof sku !== 'string') continue
      const variant = parseSku(sku)
      if (!variant) continue
      const rawQty = (entry as { qty?: unknown }).qty
      const qty = clampQty(Math.trunc(Number(rawQty)) || 1)
      items.push({ sku, ...variant, qty })
    }
    return items
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // Storage can be unavailable (private mode) or full; the cart just stays in memory.
  }
}
