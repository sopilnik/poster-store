import { shippingCents as computeShippingCents, subtotalCents as computeSubtotalCents } from '@/cart/totals'
import type { DeliveryId, PricedLine } from '@/cart/types'
import type { CheckoutInput } from './schema'

export type Order = {
  id: string
  createdAt: string
  items: PricedLine[]
  subtotalCents: number
  shippingCents: number
  totalCents: number
  address: Omit<CheckoutInput, 'payment' | 'delivery'>
  delivery: DeliveryId
  payment?: 'demo' | 'stripe'
  paymentStatus?: 'pending' | 'paid'
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function makeOrderId(random: (n: number) => Uint8Array = n => globalThis.crypto.getRandomValues(new Uint8Array(n))): string {
  const bytes = random(6)
  let suffix = ''
  for (const byte of bytes) {
    suffix += ALPHABET.charAt(byte % ALPHABET.length)
  }
  return `FL-${suffix}`
}

export function buildOrder(input: CheckoutInput, lines: PricedLine[], now: string): Order {
  const subtotal = computeSubtotalCents(lines)
  const shipping = computeShippingCents(subtotal, input.delivery)
  return {
    id: makeOrderId(),
    createdAt: now,
    items: lines,
    subtotalCents: subtotal,
    shippingCents: shipping,
    totalCents: subtotal + shipping,
    address: {
      email: input.email,
      fullName: input.fullName,
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country,
    },
    delivery: input.delivery,
  }
}
