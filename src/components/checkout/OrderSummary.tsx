import Link from 'next/link'
import { shippingCents, subtotalCents, totalCents } from '@/cart/totals'
import type { DeliveryId, PricedLine } from '@/cart/types'
import { Poster } from '@/posters/Poster'
import { formatCents } from '@/lib/money'

const DELIVERY_LABELS: Record<DeliveryId, string> = {
  standard: 'Standard shipping',
  express: 'Express shipping',
}

export function OrderSummary({ lines, delivery }: { lines: PricedLine[]; delivery: DeliveryId }) {
  const subtotal = subtotalCents(lines)
  const shipping = shippingCents(subtotal, delivery)
  const total = totalCents(subtotal, delivery)

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-normal">Order summary</h2>
        <Link href="/cart/" className="text-sm text-primary hover:underline">
          Edit cart
        </Link>
      </div>
      <ul className="flex flex-col gap-3">
        {lines.map(line => (
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
          <span>{formatCents(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>{DELIVERY_LABELS[delivery]}</span>
          <span>{formatCents(shipping)}</span>
        </div>
        <div className="flex justify-between font-medium text-foreground">
          <span>Total</span>
          <span>{formatCents(total)}</span>
        </div>
      </div>
    </div>
  )
}
