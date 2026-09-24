import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { CartContext } from '@/cart/CartProvider'
import type { CartAction, CartContextValue, CartItem } from '@/cart/types'
import { PRODUCTS } from '@/catalog/products'
import { MAX_CART_LINES } from '@/checkout/limits'
import { loadOrder, saveOrder } from '@/checkout/storage'
import { CheckoutPageClient } from './CheckoutPageClient'
import { fillCheckoutForm, makeOrder } from './test-helpers'

vi.mock('@/lib/site', () => ({ CHECKOUT_API: 'http://127.0.0.1:8787', hasCheckoutApi: () => true }))
vi.mock('sonner', () => ({ toast: vi.fn() }))

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: pushMock }) }))

const CART_ITEMS: CartItem[] = [
  { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
]

function manyCartItems(count: number): CartItem[] {
  const items: CartItem[] = []
  for (const product of PRODUCTS) {
    for (const paletteId of product.palettes) {
      if (items.length >= count) return items
      items.push({ sku: `${product.slug}-a3-${paletteId}`, productSlug: product.slug, sizeId: 'a3', paletteId, qty: 1 })
    }
  }
  throw new Error(`the catalog does not have ${count} distinct variants`)
}

function contextValue(overrides: Partial<CartContextValue> = {}): CartContextValue {
  return {
    items: CART_ITEMS,
    hydrated: true,
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    dispatch: vi.fn<(action: CartAction) => void>(),
    ...overrides,
  }
}

beforeEach(() => {
  window.sessionStorage.clear()
  pushMock.mockClear()
  vi.mocked(toast).mockClear()
})

test('a rejected checkout session request keeps the form and shows the toast', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('network error')
    })
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(toast).toHaveBeenCalledWith('Card payment is unavailable right now. You can place a demo order instead.')
  })
  expect(dispatch).not.toHaveBeenCalledWith({ type: 'clear' })
  expect(pushMock).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: /pay with card/i })).toBeInTheDocument()
  expect(loadOrder()).toBeNull()
})

test('a cart over the line limit shows the card limit toast instead of starting checkout', async () => {
  const fetchSpy = vi.fn()
  vi.stubGlobal('fetch', fetchSpy)
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ items: manyCartItems(MAX_CART_LINES + 1), dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(toast).toHaveBeenCalledWith(
      `Card payment takes up to ${MAX_CART_LINES} different items. Remove some, or place a demo order.`
    )
  })
  expect(fetchSpy).not.toHaveBeenCalled()
  expect(dispatch).not.toHaveBeenCalledWith({ type: 'clear' })
  expect(loadOrder()).toBeNull()
})

test('a checkout session response pointing off Stripe keeps the cart and does not navigate', async () => {
  const assignSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: assignSpy })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ url: 'https://evilstripe.com/pay' }) }))
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(toast).toHaveBeenCalledWith('Card payment is unavailable right now. You can place a demo order instead.')
  })
  expect(dispatch).not.toHaveBeenCalledWith({ type: 'clear' })
  expect(assignSpy).not.toHaveBeenCalled()
  expect(loadOrder()).toBeNull()
})

test('a checkout session response using a non-https url to a Stripe host keeps the cart and does not navigate', async () => {
  const assignSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: assignSpy })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ url: 'http://checkout.stripe.com/c/pay/cs_test_1' }) }))
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(toast).toHaveBeenCalledWith('Card payment is unavailable right now. You can place a demo order instead.')
  })
  expect(dispatch).not.toHaveBeenCalledWith({ type: 'clear' })
  expect(assignSpy).not.toHaveBeenCalled()
  expect(loadOrder()).toBeNull()
})

test('a checkout session response without a valid https url keeps the cart and does not navigate', async () => {
  const assignSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: assignSpy })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ url: 'javascript:alert(1)' }) }))
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(toast).toHaveBeenCalledWith('Card payment is unavailable right now. You can place a demo order instead.')
  })
  expect(dispatch).not.toHaveBeenCalledWith({ type: 'clear' })
  expect(assignSpy).not.toHaveBeenCalled()
  expect(loadOrder()).toBeNull()
})

test('a checkout session response with a valid https url clears the cart and navigates there', async () => {
  const assignSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: assignSpy })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }) }))
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(assignSpy).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_test_1')
  })
  expect(dispatch).toHaveBeenCalledWith({ type: 'clear' })
  expect(toast).not.toHaveBeenCalled()
  expect(loadOrder()).toMatchObject({ payment: 'stripe', paymentStatus: 'pending' })
})

test('the redirect notice replaces the empty-cart view while the browser leaves for Stripe', async () => {
  const assignSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: assignSpy })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }) }))
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  const { rerender } = render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(assignSpy).toHaveBeenCalled()
  })

  rerender(
    <CartContext.Provider value={contextValue({ dispatch, items: [] })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  expect(screen.queryByText('Your cart is empty.')).toBeNull()
  expect(screen.getByRole('status')).toHaveTextContent('Taking you to Stripe…')
})

test('the redirect notice goes away when the page is restored from the cache', async () => {
  const assignSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: assignSpy })
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_1' }) }))
  )
  const dispatch = vi.fn<(action: CartAction) => void>()
  const { rerender } = render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await fillCheckoutForm(userEvent)
  await userEvent.click(screen.getByRole('radio', { name: /card via stripe/i }))

  await userEvent.click(screen.getByRole('button', { name: /pay with card/i }))

  await waitFor(() => {
    expect(assignSpy).toHaveBeenCalled()
  })

  rerender(
    <CartContext.Provider value={contextValue({ dispatch, items: [] })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  expect(screen.getByRole('status')).toHaveTextContent('Taking you to Stripe…')

  const persistedEvent = new Event('pageshow')
  Object.defineProperty(persistedEvent, 'persisted', { value: true })
  act(() => {
    window.dispatchEvent(persistedEvent)
  })

  expect(screen.queryByRole('status')).toBeNull()
})

test('a page restored from the back-forward cache puts the pending order back into the cart', async () => {
  const reloadSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: vi.fn(), reload: reloadSpy })
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ items: [], dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  const order = makeOrder({ payment: 'stripe', paymentStatus: 'pending' })
  saveOrder(order)

  const persistedEvent = new Event('pageshow')
  Object.defineProperty(persistedEvent, 'persisted', { value: true })
  act(() => {
    window.dispatchEvent(persistedEvent)
  })

  expect(dispatch).toHaveBeenCalledWith({ type: 'replace', items: order.items })
  expect(loadOrder()).toBeNull()
  expect(reloadSpy).not.toHaveBeenCalled()
})

test('a page restored from the back-forward cache with items in the cart changes nothing', async () => {
  const reloadSpy = vi.fn()
  vi.stubGlobal('location', { ...window.location, assign: vi.fn(), reload: reloadSpy })
  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  const persistedEvent = new Event('pageshow')
  Object.defineProperty(persistedEvent, 'persisted', { value: true })
  act(() => {
    window.dispatchEvent(persistedEvent)
  })

  expect(dispatch).not.toHaveBeenCalledWith({ type: 'replace', items: expect.anything() })
  expect(reloadSpy).not.toHaveBeenCalled()
})

test('a pending Stripe order is restored into the cart and cleared from storage', async () => {
  const order = makeOrder()
  saveOrder(order)

  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ items: [], dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  await waitFor(() => {
    expect(dispatch).toHaveBeenCalledWith({ type: 'replace', items: order.items })
  })
  await waitFor(() => {
    expect(loadOrder()).toBeNull()
  })
})

test('a placed demo order is not restored and shows the placed message', async () => {
  const order = makeOrder({ payment: 'demo', paymentStatus: undefined })
  saveOrder(order)

  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ items: [], dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  expect(await screen.findByText('Your order was placed.')).toBeInTheDocument()
  expect(dispatch).not.toHaveBeenCalled()
  expect(loadOrder()).not.toBeNull()
})

test('a paid Stripe order is not restored, stays stored and the cart stays empty', async () => {
  const order = makeOrder({ paymentStatus: 'paid' })
  saveOrder(order)

  const dispatch = vi.fn<(action: CartAction) => void>()
  render(
    <CartContext.Provider value={contextValue({ items: [], dispatch })}>
      <CheckoutPageClient />
    </CartContext.Provider>
  )

  expect(await screen.findByText('Your order was placed.')).toBeInTheDocument()
  expect(dispatch).not.toHaveBeenCalledWith({ type: 'replace', items: order.items })
  expect(loadOrder()).not.toBeNull()
  expect(loadOrder()?.paymentStatus).toBe('paid')
})
