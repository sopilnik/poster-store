import Link from 'next/link'
import { cn } from 'cn'
import { shippingCents, subtotalCents, totalCents } from '@/cart/totals'
import type { DeliveryId, PricedLine } from '@/cart/types'
import { DELIVERY_LABELS } from '@/cart/delivery'
import { buttonVariants } from '@/components/ui/button'
import { formatCents } from '@/lib/money'

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
          <span>Shipping from $9, free from $150, chosen at checkout</span>
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
      {estimate ? (
        <Link href="/checkout/" className={cn(buttonVariants())}>
          Checkout
        </Link>
      ) : null}
    </div>
  )
}
