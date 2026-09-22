import { cartReducer, clampQty, MAX_QTY } from './reducer'
import type { CartState } from './types'

const variant = { productSlug: 'quiet-hours', sizeId: 'a2' as const, paletteId: 'ink' as const }
const otherPalette = { productSlug: 'quiet-hours', sizeId: 'a2' as const, paletteId: 'paper' as const }

function empty(): CartState {
  return { items: [] }
}

test('add creates a line with qty 1', () => {
  const state = cartReducer(empty(), { type: 'add', variant })
  expect(state.items).toEqual([
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
  ])
})

test('adding the same variant increments', () => {
  let state = cartReducer(empty(), { type: 'add', variant })
  state = cartReducer(state, { type: 'add', variant })
  expect(state.items).toHaveLength(1)
  expect(state.items[0]?.qty).toBe(2)
})

test('a different palette is a separate line', () => {
  let state = cartReducer(empty(), { type: 'add', variant })
  state = cartReducer(state, { type: 'add', variant: otherPalette })
  expect(state.items).toHaveLength(2)
})

test('setQty clamps to 1 and 10', () => {
  let state = cartReducer(empty(), { type: 'add', variant })
  const sku = state.items[0]?.sku ?? ''
  state = cartReducer(state, { type: 'setQty', sku, qty: 0 })
  expect(state.items[0]?.qty).toBe(1)
  state = cartReducer(state, { type: 'setQty', sku, qty: 99 })
  expect(state.items[0]?.qty).toBe(MAX_QTY)
})

test('remove drops the line', () => {
  let state = cartReducer(empty(), { type: 'add', variant })
  const sku = state.items[0]?.sku ?? ''
  state = cartReducer(state, { type: 'remove', sku })
  expect(state.items).toEqual([])
})

test('clear empties the cart', () => {
  let state = cartReducer(empty(), { type: 'add', variant })
  state = cartReducer(state, { type: 'clear' })
  expect(state.items).toEqual([])
})

test('clampQty clamps below the minimum, above the maximum, and passes through in range', () => {
  expect(clampQty(0)).toBe(1)
  expect(clampQty(11)).toBe(MAX_QTY)
  expect(clampQty(5)).toBe(5)
})

test('replace swaps the items outright', () => {
  const items = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2' as const, paletteId: 'ink' as const, qty: 3 },
  ]
  const state = cartReducer(empty(), { type: 'replace', items })
  expect(state.items).toBe(items)
})
