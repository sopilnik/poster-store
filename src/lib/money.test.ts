import { formatCents, formatDollars } from './money'
test('formats whole and fractional dollars', () => {
  expect(formatCents(2900)).toBe('$29.00')
  expect(formatCents(4505)).toBe('$45.05')
  expect(formatCents(0)).toBe('$0.00')
})

// formatDollars rounds to whole dollars; it is for shipping copy only, never for prices shown at checkout.
test('formats whole dollars, rounding for copy lines', () => {
  expect(formatDollars(15000)).toBe('$150')
  expect(formatDollars(900)).toBe('$9')
  expect(formatDollars(1950)).toBe('$20')
})
