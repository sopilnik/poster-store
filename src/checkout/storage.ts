import type { DeliveryId } from '@/cart/types'
import type { Order } from './order'

export const ORDER_KEY = 'formline.order'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isDelivery(value: unknown): value is DeliveryId {
  return value === 'standard' || value === 'express'
}

const ORDER_FIELD_CHECKS: ((order: Record<string, unknown>) => boolean)[] = [
  (order) => typeof order.id === 'string' && order.id.length > 0,
  (order) => typeof order.createdAt === 'string',
  (order) => Array.isArray(order.items),
  (order) => isFiniteNumber(order.subtotalCents),
  (order) => isFiniteNumber(order.shippingCents),
  (order) => isFiniteNumber(order.totalCents),
  (order) => isDelivery(order.delivery),
  (order) => Boolean(order.address) && typeof order.address === 'object',
]

function isWellFormedOrder(value: unknown): value is Order {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return ORDER_FIELD_CHECKS.every((check) => check(candidate))
}

export function saveOrder(order: Order): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(ORDER_KEY, JSON.stringify(order))
  } catch {
    // Storage can be unavailable (private mode) or full; the order stays in memory only.
  }
}

export function clearOrder(): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(ORDER_KEY)
  } catch {
    // Storage can be unavailable (private mode); nothing to clean up in that case.
  }
}

export function loadOrder(): Order | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(ORDER_KEY)

    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)

    if (!isWellFormedOrder(parsed)) return null

    return parsed
  } catch {
    return null
  }
}
