import { ORDER_KEY, clearOrder, loadOrder, saveOrder } from './storage'
import type { Order } from './order'

const ORDER: Order = {
  id: 'FL-ABC123',
  createdAt: '2026-01-01T00:00:00.000Z',
  items: [],
  subtotalCents: 9300,
  shippingCents: 900,
  totalCents: 10200,
  address: {
    email: 'buyer@example.com',
    fullName: 'Jordan Rivers',
    address: '221B Baker Street',
    city: 'London',
    postalCode: 'NW1 6XE',
    country: 'United Kingdom',
  },
  delivery: 'standard',
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('saveOrder then loadOrder round-trips', () => {
  saveOrder(ORDER)
  expect(loadOrder()).toEqual(ORDER)
})

test('loadOrder returns null when nothing is stored', () => {
  expect(loadOrder()).toBeNull()
})

test('loadOrder returns null on malformed JSON', () => {
  window.localStorage.setItem(ORDER_KEY, '{not json')
  expect(loadOrder()).toBeNull()
})

test('loadOrder returns null when the record is missing an id', () => {
  window.localStorage.setItem(ORDER_KEY, JSON.stringify({ ...ORDER, id: undefined }))
  expect(loadOrder()).toBeNull()
})

test('loadOrder returns null when items is not an array', () => {
  window.localStorage.setItem(ORDER_KEY, JSON.stringify({ ...ORDER, items: 'nope' }))
  expect(loadOrder()).toBeNull()
})

test('loadOrder returns null when totalCents is not finite', () => {
  window.localStorage.setItem(ORDER_KEY, '{"id":"FL-ABC123","createdAt":"x","items":[],"subtotalCents":1,"shippingCents":1,"totalCents":null,"delivery":"standard","address":{}}')
  expect(loadOrder()).toBeNull()
})

test('clearOrder removes a stored order', () => {
  saveOrder(ORDER)
  clearOrder()
  expect(loadOrder()).toBeNull()
})

test('clearOrder does not throw when nothing is stored', () => {
  expect(() => clearOrder()).not.toThrow()
})

test('a throwing localStorage.removeItem does not throw', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() => clearOrder()).not.toThrow()
})

test('a throwing localStorage.getItem yields null and saveOrder still does not throw', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(loadOrder()).toBeNull()
  expect(() => saveOrder(ORDER)).not.toThrow()
})
