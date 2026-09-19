import { render, screen } from '@testing-library/react'
import { Header } from './Header'
import { ThemeProvider } from './ThemeProvider'

test('links to the shop and a collection, and the theme toggle has an accessible name', () => {
  render(
    <ThemeProvider>
      <Header />
    </ThemeProvider>
  )
  expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('href', '/shop/')
  expect(screen.getByRole('link', { name: 'Night' })).toHaveAttribute('href', '/collections/night/')
  expect(screen.getByRole('button', { name: /switch theme/i })).toBeInTheDocument()
})
