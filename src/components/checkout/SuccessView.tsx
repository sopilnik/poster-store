'use client'

import Link from 'next/link'
import { useEffect, useReducer } from 'react'
import { loadOrder } from '@/checkout/storage'
import { Poster } from '@/posters/Poster'
import { formatCents } from '@/lib/money'

export function SuccessView() {
  const [mounted, markMounted] = useReducer(() => true, false)
  useEffect(() => {
    markMounted()
  }, [])

  const order = mounted ? loadOrder() : null

  if (!order) {
    return (
      <div className="mt-6 flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          A confirmation lives only in the tab that placed the order.
        </p>
        <Link href="/shop/" className="text-sm text-primary hover:underline">
          Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Order {order.id}</h1>
      <ul className="flex flex-col gap-3">
        {order.items.map(line => (
          <li key={line.sku} className="flex gap-3 text-sm">
            <Poster
              spec={line.product}
              palette={line.palette}
              rootProps={{ 'aria-hidden': true, width: 40, height: 56 }}
            />
            <div className="flex flex-1 flex-col">
              <span>{line.product.name}</span>
              <span className="text-muted-foreground">
                {line.size.label} · {line.palette.name} · Qty {line.qty}
              </span>
            </div>
            <span>{formatCents(line.lineCents)}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCents(order.subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatCents(order.shippingCents)}</span>
        </div>
        <div className="flex justify-between font-medium text-foreground">
          <span>Total</span>
          <span>{formatCents(order.totalCents)}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>{order.address.fullName}</p>
        <p>{order.address.address}</p>
        <p>
          {order.address.city}, {order.address.postalCode}
        </p>
        <p>{order.address.country}</p>
        <p>{order.address.email}</p>
      </div>
      <p className="text-sm text-muted-foreground">This is a demo. No payment was taken and nothing will ship.</p>
      <Link href="/shop/" className="text-sm text-primary hover:underline">
        Back to the shop
      </Link>
    </div>
  )
}
