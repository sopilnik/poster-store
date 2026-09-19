'use client'

import { useEffect, useState } from 'react'
import { formatCents } from '@/lib/money'
import { CHECKOUT_API, hasCheckoutApi } from '@/lib/site'

type SessionStatus = { payment_status: string; amount_total: number | null }

type State = { kind: 'loading' } | { kind: 'paid'; amountCents: number } | { kind: 'not-completed' } | { kind: 'unavailable' }

export function PaymentStatus({ sessionId, onPaid }: { sessionId: string | null; onPaid?: () => void }) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    if (!sessionId || !hasCheckoutApi()) return
    let cancelled = false

    fetch(`${CHECKOUT_API}/checkout/session?id=${encodeURIComponent(sessionId)}`)
      .then(response => {
        if (!response.ok) throw new Error('session lookup failed')
        return response.json() as Promise<SessionStatus>
      })
      .then(data => {
        if (cancelled) return
        if (data.payment_status === 'paid' && typeof data.amount_total === 'number') {
          setState({ kind: 'paid', amountCents: data.amount_total })
          onPaid?.()
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
  }, [sessionId, onPaid])

  if (!sessionId || !hasCheckoutApi() || state.kind === 'loading') return null

  const text =
    state.kind === 'paid'
      ? `Paid (test mode) · ${formatCents(state.amountCents)}`
      : state.kind === 'not-completed'
        ? 'Payment not completed'
        : 'Payment status unavailable'

  return <p className="text-sm font-medium text-foreground">{text}</p>
}
