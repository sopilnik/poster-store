import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { priceLines } from '@/cart/totals'
import type { CartItem } from '@/cart/types'
import type { CheckoutInput } from '@/checkout/schema'
import { CheckoutForm } from './CheckoutForm'

function lines() {
  const items: CartItem[] = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
  ]
  return priceLines(items)
}

test('submitting empty shows at least four error messages and onSubmit is not called', async () => {
  const onSubmit = vi.fn<(input: CheckoutInput) => void>()
  render(<CheckoutForm lines={lines()} onSubmit={onSubmit} />)

  await userEvent.click(screen.getByRole('button', { name: /place demo order/i }))

  await waitFor(() => {
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(4)
  })
  expect(onSubmit).not.toHaveBeenCalled()
})

test('filling valid values and choosing express calls onSubmit once with delivery express', async () => {
  const onSubmit = vi.fn<(input: CheckoutInput) => void>()
  render(<CheckoutForm lines={lines()} onSubmit={onSubmit} />)

  await userEvent.type(screen.getByLabelText(/email/i), 'buyer@example.com')
  await userEvent.type(screen.getByLabelText(/full name/i), 'Jordan Rivers')
  await userEvent.type(screen.getByLabelText(/^address/i), '221B Baker Street')
  await userEvent.type(screen.getByLabelText(/city/i), 'London')
  await userEvent.type(screen.getByLabelText(/postal code/i), 'NW1 6XE')

  await userEvent.click(screen.getByRole('radio', { name: /express/i }))
  await waitFor(() => {
    expect(screen.getByText('$19.00')).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /place demo order/i }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
  expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ delivery: 'express' })
})
