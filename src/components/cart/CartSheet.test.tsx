import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartContext, CartProvider, useCart } from '@/cart/CartProvider'
import { CartSheet } from './CartSheet'
import type { CartAction, CartContextValue } from '@/cart/types'

let pathname = '/cart/'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

function contextValue(close: () => void): CartContextValue {
  return { items: [], hydrated: true, isOpen: true, open: vi.fn(), close, dispatch: vi.fn<(action: CartAction) => void>() }
}

function OpenButton() {
  const { open } = useCart()
  return (
    <button type="button" onClick={open}>
      open
    </button>
  )
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
  expect(close.mock.calls.length).toBe(1)

  pathname = '/checkout/'
  rerender(
    <CartContext.Provider value={contextValue(close)}>
      <CartSheet />
    </CartContext.Provider>
  )

  expect(close.mock.calls.length).toBe(2)
})

test('closes the sheet after navigation, with a real cart provider', async () => {
  const user = userEvent.setup()
  const { rerender } = render(
    <CartProvider>
      <OpenButton />
      <CartSheet />
    </CartProvider>
  )

  await user.click(screen.getByRole('button', { name: 'open' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()

  pathname = '/checkout/'
  rerender(
    <CartProvider>
      <OpenButton />
      <CartSheet />
    </CartProvider>
  )

  expect(screen.queryByRole('dialog')).toBeNull()
})
