'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { MAX_QTY } from '@/cart/reducer'
import type { CartAction, PricedLine } from '@/cart/types'
import { Poster } from '@/posters/Poster'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/money'

export function CartLines({
  lines,
  dispatch,
}: {
  lines: PricedLine[]
  dispatch(action: CartAction): void
}) {
  return (
    <ul className="flex flex-col gap-4">
      {lines.map(line => (
        <li key={line.sku} className="flex gap-3">
          <Poster
            spec={line.product}
            palette={line.palette}
            rootProps={{ 'aria-hidden': true, width: 64, height: 90 }}
          />
          <div className="flex flex-1 flex-col gap-1">
            <Link href={`/products/${line.product.slug}/`} className="font-medium hover:text-primary">
              {line.product.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {line.size.label} · {line.palette.name}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Decrease quantity of ${line.product.name}`}
                disabled={line.qty <= 1}
                onClick={() => dispatch({ type: 'setQty', sku: line.sku, qty: line.qty - 1 })}
              >
                <Minus aria-hidden="true" />
              </Button>
              <span>{line.qty}</span>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Increase quantity of ${line.product.name}`}
                disabled={line.qty >= MAX_QTY}
                onClick={() => dispatch({ type: 'setQty', sku: line.sku, qty: line.qty + 1 })}
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="flex flex-col items-end justify-between">
            <p className="font-medium">{formatCents(line.lineCents)}</p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${line.product.name}`}
              onClick={() => dispatch({ type: 'remove', sku: line.sku })}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
