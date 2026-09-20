import { render, screen } from '@testing-library/react'
import { CartContext } from '@/cart/CartProvider'
import type { CartAction, CartContextValue, CartItem } from '@/cart/types'
import { CartPageClient } from './CartPageClient'

const CART_ITEMS: CartItem[] = [
  { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
]

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

test('renders nothing before hydration, even with lines already in state', () => {
  const { container } = render(
    <CartContext.Provider value={contextValue({ hydrated: false })}>
      <CartPageClient />
    </CartContext.Provider>
  )

  expect(container).toBeEmptyDOMElement()
  expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument()
})

test('shows the cart lines once hydrated', () => {
  render(
    <CartContext.Provider value={contextValue()}>
      <CartPageClient />
    </CartContext.Provider>
  )

  expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument()
})
