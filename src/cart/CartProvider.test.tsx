import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from './CartProvider'
import { CART_KEY, loadCart } from './storage'
import { skuOf } from '../catalog/pricing'

const variant = { productSlug: 'quiet-hours', sizeId: 'a2' as const, paletteId: 'ink' as const }

function Probe() {
  const { items, hydrated, dispatch } = useCart()
  return (
    <div>
      <p>hydrated: {String(hydrated)}</p>
      <p>items: {items.length}</p>
      <button onClick={() => dispatch({ type: 'add', variant })}>add</button>
    </div>
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

test('reports hydration state and item count for an empty cart', async () => {
  render(
    <CartProvider>
      <Probe />
    </CartProvider>
  )
  expect(await screen.findByText('hydrated: true')).toBeInTheDocument()
  expect(screen.getByText('items: 0')).toBeInTheDocument()
})

test('loads the seeded cart after mount', async () => {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify([{ sku: skuOf(variant), productSlug: variant.productSlug, sizeId: variant.sizeId, paletteId: variant.paletteId, qty: 2 }])
  )
  render(
    <CartProvider>
      <Probe />
    </CartProvider>
  )
  expect(await screen.findByText('hydrated: true')).toBeInTheDocument()
  expect(screen.getByText('items: 1')).toBeInTheDocument()
})

test('dispatching add persists to storage', async () => {
  render(
    <CartProvider>
      <Probe />
    </CartProvider>
  )
  await screen.findByText('hydrated: true')
  await userEvent.click(screen.getByRole('button', { name: 'add' }))
  expect(loadCart()).toEqual([
    { sku: skuOf(variant), productSlug: variant.productSlug, sizeId: variant.sizeId, paletteId: variant.paletteId, qty: 1 },
  ])
})
