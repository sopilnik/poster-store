import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider } from '@/cart/CartProvider'
import { Header } from './Header'
import { ThemeProvider } from './ThemeProvider'

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
