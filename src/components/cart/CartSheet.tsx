'use client'

import Link from 'next/link'
import { useCart } from '@/cart/CartProvider'
import { priceLines } from '@/cart/totals'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { CartLines } from './CartLines'
import { CartSummary } from './CartSummary'

export function CartSheet() {
  const { items, isOpen, close, dispatch } = useCart()
  const lines = priceLines(items)

  return (
    <Sheet
      open={isOpen}
      onOpenChange={next => {
        if (!next) close()
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Your cart</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              <Link href="/shop/" className="text-sm text-primary hover:underline">
                Shop
              </Link>
            </div>
          ) : (
            <>
              <CartLines lines={lines} dispatch={dispatch} />
              <CartSummary lines={lines} estimate />
              <Link href="/cart/" className="text-center text-sm text-muted-foreground hover:text-foreground">
                View cart
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
