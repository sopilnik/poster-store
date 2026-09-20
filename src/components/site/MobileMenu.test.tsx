import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileMenu } from './MobileMenu'

let pathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

beforeEach(() => {
  pathname = '/'
})

test('closes the sheet after a route change', async () => {
  const { rerender } = render(<MobileMenu />)

  await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
  expect(screen.getByRole('link', { name: 'Shop' })).toBeInTheDocument()

  pathname = '/collections/pastel/'
  rerender(<MobileMenu />)

  expect(screen.queryByRole('link', { name: 'Shop' })).not.toBeInTheDocument()
})
