import { checkoutSchema } from './schema'

const VALID = {
  email: 'buyer@example.com',
  fullName: 'Jordan Rivers',
  address: '221B Baker Street',
  city: 'London',
  postalCode: 'NW1 6XE',
  country: 'United Kingdom',
  delivery: 'standard',
  payment: 'demo',
} as const

test('a valid payload passes', () => {
  const result = checkoutSchema.safeParse(VALID)
  expect(result.success).toBe(true)
})

test('an empty email fails on the email path', () => {
  const result = checkoutSchema.safeParse({ ...VALID, email: '' })
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.some(issue => issue.path[0] === 'email')).toBe(true)
  }
})

test('a 2-char postal code fails on the postalCode path', () => {
  const result = checkoutSchema.safeParse({ ...VALID, postalCode: 'AB' })
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.some(issue => issue.path[0] === 'postalCode')).toBe(true)
  }
})

test('the postalCode message carries no raw pattern', () => {
  const result = checkoutSchema.safeParse({ ...VALID, postalCode: 'AB' })
  expect(result.success).toBe(false)
  if (!result.success) {
    const issue = result.error.issues.find(issue => issue.path[0] === 'postalCode')
    expect(issue?.message.includes('/')).toBe(false)
  }
})

test('an unknown country fails on the country path', () => {
  const result = checkoutSchema.safeParse({ ...VALID, country: 'Narnia' })
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.some(issue => issue.path[0] === 'country')).toBe(true)
  }
})

test('payment stripe passes', () => {
  const result = checkoutSchema.safeParse({ ...VALID, payment: 'stripe' })
  expect(result.success).toBe(true)
})

test('an unknown payment value fails on the payment path', () => {
  const result = checkoutSchema.safeParse({ ...VALID, payment: 'crypto' })
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.some(issue => issue.path[0] === 'payment')).toBe(true)
  }
})

test('a missing delivery fails on the delivery path', () => {
  const withoutDelivery: Record<string, unknown> = { ...VALID }
  delete withoutDelivery.delivery
  const result = checkoutSchema.safeParse(withoutDelivery)
  expect(result.success).toBe(false)
  if (!result.success) {
    expect(result.error.issues.some(issue => issue.path[0] === 'delivery')).toBe(true)
  }
})
