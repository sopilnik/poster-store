import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShopClient } from './ShopClient'
import { PRODUCTS } from '@/catalog/products'

test('renders all products before hydration state and filters from the URL after mount', async () => {
  window.history.replaceState(null, '', '/shop/?collection=night')
  render(<ShopClient products={PRODUCTS} />)
  expect(await screen.findByText('4 posters')).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Night' })).toBeInTheDocument()
  expect(screen.getAllByRole('link', { name: /after dark|far orbit|night blocks|hush/i })).toHaveLength(4)
  expect(screen.getByRole('link', { name: /^After Dark Night from \$24\.00$/ })).toBeInTheDocument()
})

test('search writes to the URL and clear resets', async () => {
  window.history.replaceState(null, '', '/shop/')
  render(<ShopClient products={PRODUCTS} />)
  expect(screen.getByRole('heading', { level: 1, name: 'All posters' })).toBeInTheDocument()
  await userEvent.type(await screen.findByRole('searchbox', { name: /search/i }), 'hush')
  await waitFor(() => {
    expect(window.location.search).toBe('?q=hush')
    expect(screen.getByText('1 poster')).toBeInTheDocument()
  })
  await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
  expect(window.location.search).toBe('')
})

test('popstate re-syncs the grid', async () => {
  window.history.replaceState(null, '', '/shop/')
  render(<ShopClient products={PRODUCTS} />)
  await screen.findByText('16 posters')
  act(() => {
    window.history.replaceState(null, '', '/shop/?collection=pastel')
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
  expect(await screen.findByText('4 posters')).toBeInTheDocument()
})
