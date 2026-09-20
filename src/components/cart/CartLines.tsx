'use client'

import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import type { CartAction, PricedLine } from '@/cart/types'
import { Poster } from '@/posters/Poster'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/QuantityStepper'
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
            <QuantityStepper
              value={line.qty}
              onChange={qty => dispatch({ type: 'setQty', sku: line.sku, qty })}
              label={`Quantity of ${line.product.name}, ${line.size.label}`}
              decreaseLabel={`Decrease quantity of ${line.product.name}`}
              increaseLabel={`Increase quantity of ${line.product.name}`}
              className="gap-2"
            />
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
