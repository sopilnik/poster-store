import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { COLLECTIONS } from '@/catalog/collections'
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

test('the link of the current page carries aria-current', async () => {
  const [firstCollection] = COLLECTIONS
  if (!firstCollection) throw new Error('No collections configured')

  pathname = '/shop'
  const { unmount } = render(<MobileMenu />)
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
  expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: firstCollection.name })).not.toHaveAttribute('aria-current')
  unmount()

  pathname = `/collections/${firstCollection.slug}/`
  render(<MobileMenu />)
  await userEvent.click(screen.getByRole('button', { name: 'Menu' }))
  expect(screen.getByRole('link', { name: 'Shop' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: firstCollection.name })).toHaveAttribute('aria-current', 'page')
})
