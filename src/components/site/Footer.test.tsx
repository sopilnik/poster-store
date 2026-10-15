import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'
import { expectAdminDemoLink } from './test-helpers'

test('links to the admin panel demo first, in a new tab', () => {
  render(<Footer />)

  const [first] = screen.getAllByRole('link')

  expect(first).toHaveAccessibleName('Admin panel demo')
  expectAdminDemoLink('Admin panel demo')
})
