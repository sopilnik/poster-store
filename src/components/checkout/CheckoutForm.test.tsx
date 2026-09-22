import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { priceLines } from '@/cart/totals'
import type { CartItem } from '@/cart/types'
import type { CheckoutInput } from '@/checkout/schema'
import { hasCheckoutApi } from '@/lib/site'
import { CheckoutForm } from './CheckoutForm'
import { fillCheckoutForm } from './test-helpers'

vi.mock('@/lib/site', () => ({ hasCheckoutApi: vi.fn(() => false) }))

beforeEach(() => {
  vi.mocked(hasCheckoutApi).mockReturnValue(false)
})

function lines() {
  const items: CartItem[] = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
  ]
  return priceLines(items)
}

test('the order summary is exposed as a named region', () => {
  render(<CheckoutForm lines={lines()} onSubmit={vi.fn()} />)

  expect(screen.getByRole('region', { name: 'Order summary' })).toBeInTheDocument()
})

test('submitting empty shows at least four error messages and onSubmit is not called', async () => {
  const onSubmit = vi.fn<(input: CheckoutInput) => void>()
  render(<CheckoutForm lines={lines()} onSubmit={onSubmit} />)

  await userEvent.click(screen.getByRole('button', { name: /place demo order/i }))

  await waitFor(() => {
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(4)
  })
  expect(onSubmit).not.toHaveBeenCalled()
})

test('submitting empty moves focus to the first invalid field', async () => {
  const onSubmit = vi.fn<(input: CheckoutInput) => void>()
  render(<CheckoutForm lines={lines()} onSubmit={onSubmit} />)

  await userEvent.click(screen.getByRole('button', { name: /place demo order/i }))

  await waitFor(() => {
    expect(document.activeElement).toBe(screen.getByLabelText(/email/i))
  })
})

test('filling valid values and choosing express calls onSubmit once with delivery express', async () => {
  const onSubmit = vi.fn<(input: CheckoutInput) => void>()
  render(<CheckoutForm lines={lines()} onSubmit={onSubmit} />)

  await fillCheckoutForm(userEvent)

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

test('the address fields carry autocomplete tokens and a name for browser autofill', () => {
  render(<CheckoutForm lines={lines()} onSubmit={vi.fn()} />)

  expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email')
  expect(screen.getByLabelText(/full name/i)).toHaveAttribute('autocomplete', 'name')
  expect(screen.getByLabelText(/^address/i)).toHaveAttribute('autocomplete', 'street-address')
  expect(screen.getByLabelText(/city/i)).toHaveAttribute('autocomplete', 'address-level2')
  expect(screen.getByLabelText(/postal code/i)).toHaveAttribute('autocomplete', 'postal-code')
  expect(screen.getByLabelText(/email/i)).toHaveAttribute('name', 'email')
})

test('the Stripe option does not render when the checkout API is not configured', () => {
  render(<CheckoutForm lines={lines()} onSubmit={vi.fn()} />)
  expect(screen.queryByRole('radio', { name: /card via stripe/i })).not.toBeInTheDocument()
})

test('the Stripe option renders with its helper text when the checkout API is configured', () => {
  vi.mocked(hasCheckoutApi).mockReturnValue(true)
  render(<CheckoutForm lines={lines()} onSubmit={vi.fn()} />)

  expect(screen.getByRole('radio', { name: /card via stripe/i })).toBeInTheDocument()
  expect(screen.getByText(/use card number 4242 4242 4242 4242/i)).toBeInTheDocument()
})

test('the Stripe radio is described by its test-card hint for screen readers', () => {
  vi.mocked(hasCheckoutApi).mockReturnValue(true)
  render(<CheckoutForm lines={lines()} onSubmit={vi.fn()} />)

  const radio = screen.getByRole('radio', { name: /card via stripe/i })
  expect(radio).toHaveAttribute('aria-describedby', 'stripe-hint')
  expect(document.getElementById('stripe-hint')).toHaveTextContent(/use card number 4242 4242 4242 4242/i)
})

test('choosing Stripe changes the submit label to Pay with card', async () => {
  vi.mocked(hasCheckoutApi).mockReturnValue(true)
  render(<CheckoutForm lines={lines()} onSubmit={vi.fn()} />)

  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  expect(screen.getByRole('button', { name: /pay with card/i })).toBeInTheDocument()
})
