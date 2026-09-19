import { render, screen, waitFor } from '@testing-library/react'
import { hasCheckoutApi } from '@/lib/site'
import { PaymentStatus } from './PaymentStatus'

vi.mock('@/lib/site', () => ({ CHECKOUT_API: 'http://127.0.0.1:8787', hasCheckoutApi: vi.fn(() => true) }))

beforeEach(() => {
  vi.mocked(hasCheckoutApi).mockReturnValue(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

test('renders nothing when there is no session id', () => {
  const { container } = render(<PaymentStatus sessionId={null} />)
  expect(container).toBeEmptyDOMElement()
})

test('renders the paid status with the amount from the response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ payment_status: 'paid', amount_total: 3800 }) }))
  )
  render(<PaymentStatus sessionId="cs_test_1" />)

  expect(await screen.findByText('Paid (test mode) · $38.00')).toBeInTheDocument()
})

test('renders "Payment not completed" when the session is not paid', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ payment_status: 'unpaid', amount_total: null }) }))
  )
  render(<PaymentStatus sessionId="cs_test_1" />)

  expect(await screen.findByText('Payment not completed')).toBeInTheDocument()
})

test('renders "Payment status unavailable" when the request fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, json: async () => ({}) }))
  )
  render(<PaymentStatus sessionId="cs_test_1" />)

  expect(await screen.findByText('Payment status unavailable')).toBeInTheDocument()
})

test('renders "Payment status unavailable" when fetch rejects', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('network down')
    })
  )
  render(<PaymentStatus sessionId="cs_test_1" />)

  expect(await screen.findByText('Payment status unavailable')).toBeInTheDocument()
})

test('fetches the session by the given id', async () => {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ payment_status: 'paid', amount_total: 100 }) }))
  vi.stubGlobal('fetch', fetchMock)
  render(<PaymentStatus sessionId="cs_test_1" />)

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('id=cs_test_1'))
  })
})

test('renders nothing and never fetches when no checkout API is configured', async () => {
  vi.mocked(hasCheckoutApi).mockReturnValue(false)
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const { container } = render(<PaymentStatus sessionId="cs_test_1" />)

  expect(container).toBeEmptyDOMElement()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('calls onPaid once the session resolves as paid', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ payment_status: 'paid', amount_total: 3800 }) }))
  )
  const onPaid = vi.fn()
  render(<PaymentStatus sessionId="cs_test_1" onPaid={onPaid} />)

  await waitFor(() => {
    expect(onPaid).toHaveBeenCalledTimes(1)
  })
})

test('does not call onPaid when the session is not paid', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ payment_status: 'unpaid', amount_total: null }) }))
  )
  const onPaid = vi.fn()
  render(<PaymentStatus sessionId="cs_test_1" onPaid={onPaid} />)

  await screen.findByText('Payment not completed')
  expect(onPaid).not.toHaveBeenCalled()
})
