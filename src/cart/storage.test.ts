import { CART_KEY, loadCart, saveCart } from './storage'
import { MAX_QTY } from './reducer'
import type { CartItem } from './types'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('saveCart then loadCart round-trips', () => {
  const items: CartItem[] = [
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 3 },
  ]
  saveCart(items)
  expect(loadCart()).toEqual(items)
})

test('a stored item with an unknown sku is dropped', () => {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify([
      { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
      { sku: 'nope-a2-ink', productSlug: 'nope', sizeId: 'a2', paletteId: 'ink', qty: 1 },
    ])
  )
  expect(loadCart()).toEqual([
    { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 },
  ])
})

test('qty 99 becomes 10', () => {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify([{ sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 99 }])
  )
  expect(loadCart()[0]?.qty).toBe(MAX_QTY)
})

test('a throwing localStorage.getItem yields an empty cart and saveCart still does not throw', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(loadCart()).toEqual([])
  expect(() =>
    saveCart([{ sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 1 }])
  ).not.toThrow()
})
