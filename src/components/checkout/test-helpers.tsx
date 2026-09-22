import { screen } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'
import { priceLines, shippingCents, subtotalCents } from '@/cart/totals'
import type { CartItem, DeliveryId } from '@/cart/types'
import type { Order } from '@/checkout/order'

const STANDARD_ITEMS: CartItem[] = [
  { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
]

export function makeOrder(overrides: Partial<Order> = {}): Order {
  const lines = priceLines(STANDARD_ITEMS)
  const subtotal = subtotalCents(lines)
  const delivery: DeliveryId = overrides.delivery ?? 'standard'
  const shipping = shippingCents(subtotal, delivery)
  return {
    id: 'FL-AB12C3',
    createdAt: '2026-01-01T00:00:00.000Z',
    items: lines,
    subtotalCents: subtotal,
    shippingCents: shipping,
    totalCents: subtotal + shipping,
    address: {
      email: 'buyer@example.com',
      fullName: 'Jordan Rivers',
      address: '221B Baker Street',
      city: 'London',
      postalCode: 'NW1 6XE',
      country: 'United Kingdom',
    },
    delivery,
    payment: 'stripe',
    paymentStatus: 'pending',
    ...overrides,
  }
}

export async function fillCheckoutForm(user: typeof userEvent): Promise<void> {
  await user.type(screen.getByLabelText(/email/i), 'buyer@example.com')
  await user.type(screen.getByLabelText(/full name/i), 'Jordan Rivers')
  await user.type(screen.getByLabelText(/^address/i), '221B Baker Street')
  await user.type(screen.getByLabelText(/city/i), 'London')
  await user.type(screen.getByLabelText(/postal code/i), 'NW1 6XE')
}
