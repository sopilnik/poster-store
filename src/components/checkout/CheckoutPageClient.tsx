'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useReducer, useState } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/cart/CartProvider'
import { priceLines } from '@/cart/totals'
import { MAX_CART_LINES } from '@/checkout/limits'
import { buildOrder } from '@/checkout/order'
import type { CheckoutInput } from '@/checkout/schema'
import { clearOrder, loadOrder, saveOrder } from '@/checkout/storage'
import { CHECKOUT_API } from '@/lib/site'
import { CheckoutForm } from './CheckoutForm'

function isStripeUrl(target: URL): boolean {
  return target.protocol === 'https:' && (target.hostname === 'stripe.com' || target.hostname.endsWith('.stripe.com'))
}

type CheckState = { checked: false; placed: false } | { checked: true; placed: boolean }

function checkReducer(_state: CheckState, placed: boolean): CheckState {
  return { checked: true, placed }
}

export function CheckoutPageClient() {
  const { items, hydrated, dispatch } = useCart()
  const router = useRouter()
  const lines = priceLines(items)
  const [{ checked, placed }, markChecked] = useReducer(checkReducer, { checked: false, placed: false })
  const [redirecting, setRedirecting] = useState(false)

  const restorePendingOrder = useCallback((): boolean => {
    if (items.length !== 0) return false
    const stored = loadOrder()
    if (stored?.paymentStatus !== 'pending') return false
    dispatch({ type: 'replace', items: stored.items })
    clearOrder()
    return true
  }, [items, dispatch])

  useEffect(() => {
    if (!hydrated) return
    restorePendingOrder()
    markChecked(lines.length === 0 ? loadOrder() !== null : false)
    // The cart at mount time decides whether a pending order is restored and whether the cart is
    // already placed; both are read once, right after hydration, and do not need to re-run when
    // the cart changes afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  useEffect(() => {
    // A buyer who comes back from Stripe with the Back button gets this page from the browser's
    // back-forward cache exactly as it was left — the redirect notice on screen and the cart
    // already cleared; restoring in place avoids a navigation, which Chrome refused with an
    // error page when it was tried from inside the restore.
    function handlePageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      setRedirecting(false)
      restorePendingOrder()
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [restorePendingOrder])

  if (!hydrated || !checked) return null

  if (redirecting) {
    return <p role="status" className="mt-6 text-sm text-muted-foreground">Taking you to Stripe…</p>
  }

  if (placed) {
    return (
      <div className="mt-6 flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">Your order was placed.</p>
        <Link href="/checkout/success/" className="text-sm text-primary hover:underline">
          View confirmation
        </Link>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Link href="/shop/" className="text-sm text-primary hover:underline">
          Shop
        </Link>
      </div>
    )
  }

  async function handleSubmit(input: CheckoutInput) {
    const order = buildOrder(input, lines, new Date().toISOString())

    if (input.payment === 'stripe') {
      if (order.items.length > MAX_CART_LINES) {
        toast(`Card payment takes up to ${MAX_CART_LINES} different items. Remove some, or place a demo order.`)
        return
      }

      saveOrder({ ...order, payment: 'stripe', paymentStatus: 'pending' })
      try {
        const response = await fetch(`${CHECKOUT_API}/checkout/session`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id,
            items: order.items.map(line => ({ sku: line.sku, qty: line.qty })),
            delivery: order.delivery,
            email: input.email,
          }),
        })
        if (!response.ok) throw new Error('checkout session request failed')
        const data: unknown = await response.json()
        const url = data && typeof data === 'object' ? (data as Record<string, unknown>).url : undefined
        const target = typeof url === 'string' ? new URL(url) : null
        if (!target || !isStripeUrl(target)) {
          throw new Error('checkout session response did not include a Stripe url')
        }
        setRedirecting(true)
        dispatch({ type: 'clear' })
        window.location.assign(target.href)
      } catch {
        clearOrder()
        toast('Card payment is unavailable right now. You can place a demo order instead.')
      }
      return
    }

    saveOrder({ ...order, payment: 'demo' })
    dispatch({ type: 'clear' })
    router.push('/checkout/success/')
  }

  return (
    <div className="mt-6">
      <CheckoutForm lines={lines} onSubmit={handleSubmit} />
    </div>
  )
}
