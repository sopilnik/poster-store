import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductOptions } from './ProductOptions'
import { CartContext } from '@/cart/CartProvider'
import { productBySlug } from '@/catalog/products'
import type { CartAction } from '@/cart/types'

function renderWithCart(dispatch: (action: CartAction) => void) {
  return render(
    <CartContext.Provider
      value={{ items: [], hydrated: true, isOpen: false, open: vi.fn(), close: vi.fn(), dispatch }}
    >
      <ProductOptions product={productBySlug('quiet-hours')!} />
    </CartContext.Provider>
  )
}

test('price follows size and palette selection and add dispatches the variant', async () => {
  const dispatch = vi.fn<(action: CartAction) => void>()
  renderWithCart(dispatch)
  expect(screen.getByText('$29.00')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('combobox', { name: /size/i }))
  await userEvent.click(screen.getByRole('option', { name: /A2/ }))
  expect(screen.getByText('$45.00')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('radio', { name: 'Ink' }))
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }))

  expect(dispatch).toHaveBeenCalledWith({
    type: 'add',
    variant: { productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink' },
    qty: 1,
  })
})

test('palette swatches are radios named after the palette and reflect the selection', async () => {
  renderWithCart(vi.fn())

  const paper = screen.getByRole('radio', { name: 'Paper' })
  const ink = screen.getByRole('radio', { name: 'Ink' })
  expect(paper).toHaveAttribute('aria-checked', 'true')
  expect(ink).toHaveAttribute('aria-checked', 'false')

  await userEvent.click(ink)
  expect(ink).toHaveAttribute('aria-checked', 'true')
  expect(paper).toHaveAttribute('aria-checked', 'false')
})

test('quantity stays within 1 and 10', async () => {
  const dispatch = vi.fn<(action: CartAction) => void>()
  renderWithCart(dispatch)

  const decrease = screen.getByRole('button', { name: 'Decrease quantity' })
  const increase = screen.getByRole('button', { name: 'Increase quantity' })

  await userEvent.click(decrease)
  expect(screen.getByText('1')).toBeInTheDocument()

  for (let i = 0; i < 10; i++) {
    await userEvent.click(increase)
  }
  expect(screen.getByText('10')).toBeInTheDocument()
})
