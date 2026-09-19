import Link from 'next/link'
import { shippingCents, subtotalCents, totalCents } from '@/cart/totals'
import type { DeliveryId, PricedLine } from '@/cart/types'
import { Button } from '@/components/ui/button'
import { formatCents } from '@/lib/money'

const DELIVERY_LABELS: Record<DeliveryId, string> = {
  standard: 'Standard shipping',
  express: 'Express shipping',
}

export function CartSummary({
  lines,
  delivery = 'standard',
  estimate,
}: {
  lines: PricedLine[]
  delivery?: DeliveryId
  estimate: boolean
}) {
  const subtotal = subtotalCents(lines)
  const shipping = shippingCents(subtotal, delivery)
  const total = totalCents(subtotal, delivery)

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>{formatCents(subtotal)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        {estimate ? (
          <span>Shipping from $9, free over $150, chosen at checkout</span>
        ) : (
          <>
            <span>{DELIVERY_LABELS[delivery]}</span>
            <span>{formatCents(shipping)}</span>
          </>
        )}
      </div>
      <div className="flex justify-between font-medium text-foreground">
        <span>{estimate ? 'Estimated total' : 'Total'}</span>
        <span>{formatCents(total)}</span>
      </div>
      <p className="text-xs text-muted-foreground">Free standard shipping from $150.</p>
      <p className="text-xs text-muted-foreground">Orders are not real and nothing is charged.</p>
      {estimate ? <Button nativeButton={false} render={<Link href="/checkout/">Checkout</Link>} /> : null}
    </div>
  )
}
