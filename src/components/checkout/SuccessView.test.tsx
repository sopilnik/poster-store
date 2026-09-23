import { render, screen, waitFor } from '@testing-library/react'
import { clearOrder, loadOrder, saveOrder } from '@/checkout/storage'
import { SuccessView } from './SuccessView'
import { makeOrder } from './test-helpers'

vi.mock('@/lib/site', () => ({ CHECKOUT_API: 'http://127.0.0.1:8787', hasCheckoutApi: () => true }))

test('the no-order branch still renders a heading', async () => {
  window.history.replaceState(null, '', '/checkout/success/')
  clearOrder()
  render(<SuccessView />)

  expect(await screen.findByRole('heading', { level: 1, name: 'Order confirmation' })).toBeInTheDocument()
  expect(screen.getByText('A confirmation lives only in the tab that placed the order.')).toBeInTheDocument()
})

test('a paid session persists paymentStatus paid on the stored order', async () => {
  window.history.replaceState(null, '', '/checkout/success/?session_id=cs_test_1')
  const order = makeOrder()
  saveOrder(order)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: order.totalCents, orderId: order.id }),
    }))
  )

  render(<SuccessView />)

  await waitFor(() => {
    expect(loadOrder()?.paymentStatus).toBe('paid')
  })
})

test('a session naming a different order does not mark the stored order paid', async () => {
  window.history.replaceState(null, '', '/checkout/success/?session_id=cs_test_1')
  const order = makeOrder()
  saveOrder(order)
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: order.totalCents, orderId: 'FL-ZZ99ZZ' }),
    }))
  )

  render(<SuccessView />)

  await screen.findByText('Payment not completed')
  expect(loadOrder()?.paymentStatus).toBe('pending')
})
