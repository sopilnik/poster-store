import { formatCents } from './money'
test('formats whole and fractional dollars', () => {
  expect(formatCents(2900)).toBe('$29.00')
  expect(formatCents(4505)).toBe('$45.05')
  expect(formatCents(0)).toBe('$0.00')
})
