import { act, render, screen, waitFor } from '@testing-library/react'
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
  const { container } = render(<PaymentStatus sessionId={null} orderId="FL-AAAAAA" />)
  expect(container).toBeEmptyDOMElement()
})

test('renders the paid status with the amount from the response', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: 3800, orderId: 'FL-AAAAAA' }),
    }))
  )
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(await screen.findByText('Paid (test mode) · $38.00')).toBeInTheDocument()
})

test('renders "Payment not completed" when the session is not paid', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'unpaid', amount_total: null, orderId: null }),
    }))
  )
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(await screen.findByText('Payment not completed')).toBeInTheDocument()
})

test('renders "Payment not completed" when the reply names a different order', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: 1200, orderId: 'FL-BBBBBB' }),
    }))
  )
  const onPaid = vi.fn()
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" onPaid={onPaid} />)

  expect(await screen.findByText('Payment not completed')).toBeInTheDocument()
  expect(onPaid).not.toHaveBeenCalled()
})

test('renders the paid status and calls onPaid when the reply names this order', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: 1200, orderId: 'FL-BBBBBB' }),
    }))
  )
  const onPaid = vi.fn()
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-BBBBBB" onPaid={onPaid} />)

  expect(await screen.findByText('Paid (test mode) · $12.00')).toBeInTheDocument()
  await waitFor(() => {
    expect(onPaid).toHaveBeenCalledTimes(1)
  })
})

test('renders "Payment status unavailable" when the reply body is not an object', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => 'nonsense' }))
  )
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(await screen.findByText('Payment status unavailable')).toBeInTheDocument()
})

test('renders "Payment status unavailable" when a field has the wrong type', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ payment_status: 1 }) }))
  )
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(await screen.findByText('Payment status unavailable')).toBeInTheDocument()
})

test('renders "Payment status unavailable" when the request fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, json: async () => ({}) }))
  )
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(await screen.findByText('Payment status unavailable')).toBeInTheDocument()
})

test('renders "Payment status unavailable" when fetch rejects', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('network down')
    })
  )
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(await screen.findByText('Payment status unavailable')).toBeInTheDocument()
})

test('fetches the session by the given id', async () => {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: async () => ({ payment_status: 'paid', amount_total: 100, orderId: 'FL-AAAAAA' }),
  }))
  vi.stubGlobal('fetch', fetchMock)
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('id=cs_test_1'))
  })
})

test('renders nothing and never fetches when no checkout API is configured', async () => {
  vi.mocked(hasCheckoutApi).mockReturnValue(false)
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  const { container } = render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" />)

  expect(container).toBeEmptyDOMElement()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('calls onPaid once the session resolves as paid', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'paid', amount_total: 3800, orderId: 'FL-AAAAAA' }),
    }))
  )
  const onPaid = vi.fn()
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" onPaid={onPaid} />)

  await waitFor(() => {
    expect(onPaid).toHaveBeenCalledTimes(1)
  })
})

test('does not call onPaid when the session is not paid', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ payment_status: 'unpaid', amount_total: null, orderId: null }),
    }))
  )
  const onPaid = vi.fn()
  render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" onPaid={onPaid} />)

  await screen.findByText('Payment not completed')
  expect(onPaid).not.toHaveBeenCalled()
})

test('does not refetch when onPaid changes identity across re-renders, and calls the latest onPaid', async () => {
  let resolveJson!: (value: unknown) => void
  const fetchMock = vi.fn(async () => ({
    ok: true,
    json: () =>
      new Promise(resolve => {
        resolveJson = resolve
      }),
  }))
  vi.stubGlobal('fetch', fetchMock)

  const firstOnPaid = vi.fn()
  const secondOnPaid = vi.fn()
  const thirdOnPaid = vi.fn()
  const { rerender } = render(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" onPaid={firstOnPaid} />)

  rerender(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" onPaid={secondOnPaid} />)
  rerender(<PaymentStatus sessionId="cs_test_1" orderId="FL-AAAAAA" onPaid={thirdOnPaid} />)

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  await act(async () => {
    resolveJson({ payment_status: 'paid', amount_total: 1200, orderId: 'FL-AAAAAA' })
  })

  expect(await screen.findByText('Paid (test mode) · $12.00')).toBeInTheDocument()
  expect(firstOnPaid).not.toHaveBeenCalled()
  expect(secondOnPaid).not.toHaveBeenCalled()
  expect(thirdOnPaid).toHaveBeenCalledTimes(1)
})
