'use client'

import { useEffect, useRef, useState } from 'react'
import { formatCents } from '@/lib/money'
import { CHECKOUT_API, hasCheckoutApi } from '@/lib/site'

type SessionStatus = { payment_status: string; amount_total: number | null; orderId: string | null }

function isSessionStatus(value: unknown): value is SessionStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (typeof candidate.payment_status !== 'string') return false
  if (typeof candidate.amount_total !== 'number' && candidate.amount_total !== null) return false
  if (typeof candidate.orderId !== 'string' && candidate.orderId !== null) return false
  return true
}

type State = { kind: 'loading' } | { kind: 'paid'; amountCents: number } | { kind: 'not-completed' } | { kind: 'unavailable' }

export function PaymentStatus({
  sessionId,
  orderId,
  onPaid,
}: {
  sessionId: string | null
  orderId: string
  onPaid?: () => void
}) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  const onPaidRef = useRef(onPaid)
  useEffect(() => {
    onPaidRef.current = onPaid
  })

  useEffect(() => {
    if (!sessionId || !hasCheckoutApi()) return
    let cancelled = false

    fetch(`${CHECKOUT_API}/checkout/session?id=${encodeURIComponent(sessionId)}`)
      .then(response => {
        if (!response.ok) throw new Error('session lookup failed')
        return response.json() as Promise<unknown>
      })
      .then(body => {
        if (cancelled) return
        if (!isSessionStatus(body)) {
          setState({ kind: 'unavailable' })
          return
        }
        if (body.payment_status === 'paid' && typeof body.amount_total === 'number' && body.orderId === orderId) {
          setState({ kind: 'paid', amountCents: body.amount_total })
          onPaidRef.current?.()
        } else {
          setState({ kind: 'not-completed' })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'unavailable' })
      })

    return () => {
      cancelled = true
    }
  }, [sessionId, orderId])

  if (!sessionId || !hasCheckoutApi() || state.kind === 'loading') return null

  const text =
    state.kind === 'paid'
      ? `Paid (test mode) · ${formatCents(state.amountCents)}`
      : state.kind === 'not-completed'
        ? 'Payment not completed'
        : 'Payment status unavailable'

  return <p className="text-sm font-medium text-foreground">{text}</p>
}
