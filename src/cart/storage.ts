import { parseSku } from '@/catalog/pricing'
import { clampQty } from './reducer'
import type { CartItem } from './types'

export const CART_KEY = 'formline.cart.v1'

type StoredEntry = { sku?: unknown; qty?: unknown }

function readEntry(entry: unknown): CartItem | null {
  if (!entry || typeof entry !== 'object') return null

  const { sku, qty } = entry as StoredEntry

  if (typeof sku !== 'string') return null

  const variant = parseSku(sku)

  if (!variant) return null

  return { sku, ...variant, qty: clampQty(Math.trunc(Number(qty)) || 1) }
}

function mergeEntries(entries: unknown[]): CartItem[] {
  const byKey = new Map<string, CartItem>()

  for (const entry of entries) {
    const item = readEntry(entry)

    if (!item) continue

    const existing = byKey.get(item.sku)

    byKey.set(item.sku, { ...item, qty: (existing?.qty ?? 0) + item.qty })
  }

  return [...byKey.values()].map((item) => ({ ...item, qty: clampQty(item.qty) }))
}

export function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_KEY)

    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)

    return Array.isArray(parsed) ? mergeEntries(parsed) : []
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
