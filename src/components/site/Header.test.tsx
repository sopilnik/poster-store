import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { COLLECTIONS } from '@/catalog/collections'
import { CartProvider } from '@/cart/CartProvider'
import { Header } from './Header'
import { ThemeProvider } from './ThemeProvider'

let pathname = '/'
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}))

beforeEach(() => {
  pathname = '/'
})

test('links to the shop and a collection', () => {
  render(
    <ThemeProvider>
      <CartProvider>
        <Header />
      </CartProvider>
    </ThemeProvider>
  )
  expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop/')
  expect(screen.getByRole('link', { name: 'Night' })).toHaveAttribute('href', '/collections/night/')
})

test('the theme control and its three segments have accessible names, and clicking Dark sets the theme', async () => {
  render(
    <ThemeProvider>
      <CartProvider>
        <Header />
      </CartProvider>
    </ThemeProvider>
  )
  expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Light' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'System' })).toBeInTheDocument()
  const dark = screen.getByRole('radio', { name: 'Dark' })

  await userEvent.click(dark)
  expect(dark).toHaveAttribute('aria-checked', 'true')
})

test('the link of the current page carries aria-current', () => {
  const [firstCollection] = COLLECTIONS
  if (!firstCollection) throw new Error('No collections configured')

  pathname = '/shop'
  const { unmount } = render(
    <ThemeProvider>
      <CartProvider>
        <Header />
      </CartProvider>
    </ThemeProvider>
  )
  expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: firstCollection.name })).not.toHaveAttribute('aria-current')
  unmount()

  pathname = `/collections/${firstCollection.slug}/`
  render(
    <ThemeProvider>
      <CartProvider>
        <Header />
      </CartProvider>
    </ThemeProvider>
  )
  expect(screen.getByRole('link', { name: 'Shop' })).not.toHaveAttribute('aria-current')
  expect(screen.getByRole('link', { name: firstCollection.name })).toHaveAttribute('aria-current', 'page')
})
