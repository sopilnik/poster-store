import { CheckoutPageClient } from '@/components/checkout/CheckoutPageClient'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata({
  title: 'Checkout',
  description: 'Enter a shipping address and place a demo order.',
  path: '/checkout/',
})

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight">Checkout</h1>
      <CheckoutPageClient />
    </div>
  )
}
