import { render, screen, waitFor } from '@testing-library/react'
import { priceLines, shippingCents, subtotalCents } from '@/cart/totals'
import type { CartItem } from '@/cart/types'
import type { Order } from '@/checkout/order'
import { loadOrder, saveOrder } from '@/checkout/storage'
import { SuccessView } from './SuccessView'

vi.mock('@/lib/site', () => ({ CHECKOUT_API: 'http://127.0.0.1:8787', hasCheckoutApi: () => true }))

afterEach(() => {
  vi.unstubAllGlobals()
})

test('the no-order branch still renders a heading', async () => {
  window.history.replaceState(null, '', '/checkout/success/')
  window.localStorage.removeItem('formline.order')
  render(<SuccessView />)

  expect(await screen.findByRole('heading', { level: 1, name: 'Order confirmation' })).toBeInTheDocument()
  expect(screen.getByText('A confirmation lives only in the tab that placed the order.')).toBeInTheDocument()
})

test('a paid session persists paymentStatus paid on the stored order', async () => {
  window.history.replaceState(null, '', '/checkout/success/?session_id=cs_test_1')
  const items: CartItem[] = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
  ]
  const lines = priceLines(items)
  const subtotal = subtotalCents(lines)
  const shipping = shippingCents(subtotal, 'standard')
  const order: Order = {
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
    delivery: 'standard',
    payment: 'stripe',
    paymentStatus: 'pending',
  }
  saveOrder(order)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: order.totalCents }),
    }))
  )

  render(<SuccessView />)

  await waitFor(() => {
    expect(loadOrder()?.paymentStatus).toBe('paid')
  })
})
