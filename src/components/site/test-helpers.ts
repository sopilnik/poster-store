import { screen } from '@testing-library/react'

// The header and the footer link to the admin panel demo the same way: its address, in a new tab.
export function expectAdminDemoLink(name: string): void {
  const link = screen.getByRole('link', { name })

  expect(link).toHaveAttribute('href', 'https://formline-admin.sopilnik.dev/')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
}
