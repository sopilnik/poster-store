import { render } from '@testing-library/react'
import { CartContext } from '@/cart/CartProvider'
import { CartSheet } from './CartSheet'
import type { CartAction, CartContextValue } from '@/cart/types'

let pathname = '/cart/'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

function contextValue(close: () => void): CartContextValue {
  return { items: [], hydrated: true, isOpen: true, open: vi.fn(), close, dispatch: vi.fn<(action: CartAction) => void>() }
}

beforeEach(() => {
  pathname = '/cart/'
})

test('closes the sheet when the route changes', () => {
  const close = vi.fn()
  const { rerender } = render(
    <CartContext.Provider value={contextValue(close)}>
      <CartSheet />
    </CartContext.Provider>
  )
  const callsOnMount = close.mock.calls.length

  pathname = '/checkout/'
  rerender(
    <CartContext.Provider value={contextValue(close)}>
      <CartSheet />
    </CartContext.Provider>
  )

  expect(close.mock.calls.length).toBeGreaterThan(callsOnMount)
})
