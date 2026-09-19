'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useReducer } from 'react'
import { toast } from 'sonner'
import { useCart } from '@/cart/CartProvider'
import { priceLines } from '@/cart/totals'
import { buildOrder } from '@/checkout/order'
import type { CheckoutInput } from '@/checkout/schema'
import { clearOrder, loadOrder, saveOrder } from '@/checkout/storage'
import { CHECKOUT_API } from '@/lib/site'
import { CheckoutForm } from './CheckoutForm'

export function CheckoutPageClient() {
  const { items, hydrated, dispatch } = useCart()
  const router = useRouter()
  const lines = priceLines(items)
  const [checked, markChecked] = useReducer(() => true, false)

  useEffect(() => {
    if (!hydrated) return
    if (items.length === 0) {
      const stored = loadOrder()
      if (stored?.paymentStatus === 'pending') {
        dispatch({ type: 'replace', items: stored.items })
        clearOrder()
      }
    }
    markChecked()
    // The cart at mount time decides whether a pending order is restored; it is read once,
    // right after hydration, and does not need to re-run when the cart changes afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  if (!hydrated || !checked) return null

  const placed = lines.length === 0 ? loadOrder() !== null : false

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
        if (typeof url !== 'string' || !url.startsWith('https://')) {
          throw new Error('checkout session response did not include a valid url')
        }
        dispatch({ type: 'clear' })
        window.location.assign(url)
      } catch {
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
