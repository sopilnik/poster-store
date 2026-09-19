'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/cart/CartProvider'
import { priceLines } from '@/cart/totals'
import { buildOrder } from '@/checkout/order'
import type { CheckoutInput } from '@/checkout/schema'
import { loadOrder, saveOrder } from '@/checkout/storage'
import { CheckoutForm } from './CheckoutForm'

export function CheckoutPageClient() {
  const { items, hydrated, dispatch } = useCart()
  const router = useRouter()
  const lines = priceLines(items)

  if (!hydrated) return null

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

  function handleSubmit(input: CheckoutInput) {
    const order = buildOrder(input, lines, new Date().toISOString())
    saveOrder(order)
    dispatch({ type: 'clear' })
    router.push('/checkout/success/')
  }

  return (
    <div className="mt-6">
      <CheckoutForm lines={lines} onSubmit={handleSubmit} />
    </div>
  )
}
