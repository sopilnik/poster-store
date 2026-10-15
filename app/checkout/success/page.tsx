import type { Metadata } from 'next'
import { CHECKOUT_SUCCESS_PAGE } from '@/checkout/routes'
import { SuccessView } from '@/components/checkout/SuccessView'
import { pageMetadata } from '@/lib/metadata'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Order placed',
    description: 'Confirmation for a demo order placed on this device.',
    path: CHECKOUT_SUCCESS_PAGE,
  }),
  robots: { index: false, follow: true },
}

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <SuccessView />
    </div>
  )
}
