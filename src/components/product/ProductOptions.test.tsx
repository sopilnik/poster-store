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
  expect(screen.getByText('$29.00', { selector: 'p' })).toBeInTheDocument()

  await userEvent.click(screen.getByRole('combobox', { name: /size/i }))
  await userEvent.click(screen.getByRole('option', { name: /A2/ }))
  expect(screen.getByText('$45.00', { selector: 'p' })).toBeInTheDocument()

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

test('the ink dot yields to the check mark once a swatch is selected', async () => {
  renderWithCart(vi.fn())

  const paper = screen.getByRole('radio', { name: 'Paper' })
  const ink = screen.getByRole('radio', { name: 'Ink' })
  const paperDot = paper.querySelector('span[aria-hidden="true"]')
  const inkDot = ink.querySelector('span[aria-hidden="true"]')

  // The dot hides itself via the checked swatch's `data-checked` state (group-data-checked:hidden),
  // so the check mark reads alone instead of merging with the dot underneath it.
  expect(paperDot).toHaveClass('group-data-checked:hidden')
  expect(paper).toHaveAttribute('data-checked', '')
  expect(ink).not.toHaveAttribute('data-checked')

  await userEvent.click(ink)
  expect(inkDot).toHaveClass('group-data-checked:hidden')
  expect(ink).toHaveAttribute('data-checked', '')
  expect(paper).not.toHaveAttribute('data-checked')
})

test('quantity stays within 1 and 10', async () => {
  const dispatch = vi.fn<(action: CartAction) => void>()
  renderWithCart(dispatch)

  const decrease = screen.getByRole('button', { name: 'Decrease quantity' })
  const increase = screen.getByRole('button', { name: 'Increase quantity' })
  const field = screen.getByRole('textbox', { name: 'Quantity' })

  await userEvent.click(decrease)
  expect(field).toHaveValue('1')

  for (let i = 0; i < 10; i++) {
    await userEvent.click(increase)
  }
  expect(field).toHaveValue('10')
})

test('typing a quantity updates the price and the add-to-cart dispatch', async () => {
  const dispatch = vi.fn<(action: CartAction) => void>()
  renderWithCart(dispatch)

  const field = screen.getByRole('textbox', { name: 'Quantity' })
  await userEvent.clear(field)
  await userEvent.type(field, '3')
  expect(screen.getByText('$87.00', { selector: 'p' })).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }))
  expect(dispatch).toHaveBeenCalledWith({
    type: 'add',
    variant: { productSlug: 'quiet-hours', sizeId: 'a3', paletteId: 'paper' },
    qty: 3,
  })
})
