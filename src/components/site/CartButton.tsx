'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/cart/CartProvider'
import { unitCount } from '@/cart/totals'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export function CartButton() {
  const { items, hydrated, open } = useCart()
  const n = unitCount(items)

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Cart, ${n} item${n === 1 ? '' : 's'}`}
      onClick={open}
      className="relative"
    >
      <ShoppingCart aria-hidden="true" />
      {hydrated && n > 0 ? (
        <Badge className="absolute -top-1 -right-1" aria-hidden="true">
          {n}
        </Badge>
      ) : null}
    </Button>
  )
}
