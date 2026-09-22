const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
export function formatCents(cents: number): string { return usd.format(cents / 100) }

// Whole-dollar formatting for shipping copy lines only, never for a price shown at checkout.
const usdWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
export function formatDollars(cents: number): string { return usdWhole.format(cents / 100) }
