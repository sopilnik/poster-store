import { render, screen } from '@testing-library/react'
import { Input } from './input'

test('an invalid field carries the destructive border utility', () => {
  render(<Input aria-invalid aria-label="email" />)

  // The dark-theme strength of this border is verified against real computed styles
  // in tests/e2e/theme.spec.ts, since jsdom loads no Tailwind CSS.
  const field = screen.getByLabelText('email')
  expect(field.className).toContain('aria-invalid:border-destructive')
})
