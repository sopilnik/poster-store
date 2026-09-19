import { render, screen } from '@testing-library/react'
import { SuccessView } from './SuccessView'

test('the no-order branch still renders a heading', async () => {
  window.localStorage.removeItem('formline.order')
  render(<SuccessView />)

  expect(await screen.findByRole('heading', { level: 1, name: 'Order confirmation' })).toBeInTheDocument()
  expect(screen.getByText('A confirmation lives only in the tab that placed the order.')).toBeInTheDocument()
})
