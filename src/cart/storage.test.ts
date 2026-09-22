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

test('two stored entries of one sku merge into one item with the summed qty', () => {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify([
      { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 4 },
      { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 3 },
    ])
  )
  const items = loadCart()
  expect(items).toHaveLength(1)
  expect(items[0]?.qty).toBe(7)
})

test('two stored entries of one sku past the cap merge and clamp to MAX_QTY', () => {
  window.localStorage.setItem(
    CART_KEY,
    JSON.stringify([
      { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 8 },
      { sku: 'quiet-hours-a2-ink', productSlug: 'quiet-hours', sizeId: 'a2', paletteId: 'ink', qty: 8 },
    ])
  )
  const items = loadCart()
  expect(items).toHaveLength(1)
  expect(items[0]?.qty).toBe(MAX_QTY)
})

test('two stored entries of one sku with a non-finite qty merge and clamp to MAX_QTY', () => {
  // Written as a raw JSON string, not JSON.stringify of a JS array: JSON.stringify turns an
  // Infinity value into null, which would erase the case this test exists to pin.
  window.localStorage.setItem(
    CART_KEY,
    '[{"sku":"quiet-hours-a2-ink","productSlug":"quiet-hours","sizeId":"a2","paletteId":"ink","qty":1e400},' +
      '{"sku":"quiet-hours-a2-ink","productSlug":"quiet-hours","sizeId":"a2","paletteId":"ink","qty":-1e400}]'
  )
  const items = loadCart()
  expect(items).toHaveLength(1)
  expect(items[0]?.qty).toBe(MAX_QTY)
})

test('a stored object instead of an array yields an empty cart', () => {
  window.localStorage.setItem(CART_KEY, '{"items":[]}')
  expect(loadCart()).toEqual([])
})

test('a stored array of non-object entries yields an empty cart', () => {
  window.localStorage.setItem(CART_KEY, '[1,2,3]')
  expect(loadCart()).toEqual([])
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
