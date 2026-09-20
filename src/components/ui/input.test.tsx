import { render, screen } from '@testing-library/react'
import { Input } from './input'

test('an invalid field keeps the destructive border at full strength in the dark theme', () => {
  render(<Input aria-invalid aria-label="email" />)

  const field = screen.getByLabelText('email')
  expect(field.className).toContain('aria-invalid:border-destructive')
  expect(field.className).not.toContain('dark:aria-invalid:border-destructive/50')
  expect(field.className).toContain('dark:aria-invalid:ring-destructive/40')
})
