import type { Metadata } from 'next'
import { CartPageClient } from '@/components/cart/CartPageClient'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Your cart',
    description: 'Review the posters in your cart before checkout.',
    path: '/cart/',
  }),
  robots: { index: false, follow: true },
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Your cart</h1>
      <CartPageClient />
    </div>
  )
}
