import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CartButton() {
  return (
    <Button variant="ghost" size="icon" aria-label="Cart" nativeButton={false} render={<Link href="/cart/" />}>
      <ShoppingCart aria-hidden="true" />
    </Button>
  )
}
