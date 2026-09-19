'use client'

import Link from 'next/link'
import { useCart } from '@/cart/CartProvider'
import { priceLines } from '@/cart/totals'
import { CartLines } from './CartLines'
import { CartSummary } from './CartSummary'

export function CartPageClient() {
  const { items, dispatch } = useCart()
  const lines = priceLines(items)

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

  return (
    <div className="mt-6 flex flex-col gap-6">
      <CartLines lines={lines} dispatch={dispatch} />
      <CartSummary lines={lines} estimate />
    </div>
  )
}
