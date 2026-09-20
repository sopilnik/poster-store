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
      className="relative after:absolute after:-inset-1.5"
    >
      <ShoppingCart aria-hidden="true" />
      {hydrated && n > 0 ? (
        <Badge
          className="absolute top-0 right-0 h-4 min-w-4 -translate-y-[40%] translate-x-[40%] justify-center px-1 text-[11px] leading-none"
          aria-hidden="true"
        >
          {n > 99 ? '99+' : n}
        </Badge>
      ) : null}
    </Button>
  )
}
