import type { DeliveryId } from '@/cart/types'
import type { Order } from './order'

export const ORDER_KEY = 'formline.order'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isDelivery(value: unknown): value is DeliveryId {
  return value === 'standard' || value === 'express'
}

function isWellFormedOrder(value: unknown): value is Order {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.id !== 'string' || candidate.id.length === 0) return false
  if (typeof candidate.createdAt !== 'string') return false
  if (!Array.isArray(candidate.items)) return false
  if (!isFiniteNumber(candidate.subtotalCents)) return false
  if (!isFiniteNumber(candidate.shippingCents)) return false
  if (!isFiniteNumber(candidate.totalCents)) return false
  if (!isDelivery(candidate.delivery)) return false
  if (!candidate.address || typeof candidate.address !== 'object') return false
  return true
}

export function saveOrder(order: Order): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order))
  } catch {
    // Storage can be unavailable (private mode) or full; the order stays in memory only.
  }
}

export function loadOrder(): Order | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(ORDER_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isWellFormedOrder(parsed)) return null
    return parsed
  } catch {
    return null
  }
}
