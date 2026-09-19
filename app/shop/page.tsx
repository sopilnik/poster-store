import { ShopClient } from '@/components/shop/ShopClient'
import { PRODUCTS } from '@/catalog/products'
import { pageMetadata } from '@/lib/metadata'

export const metadata = pageMetadata({
  title: 'Shop',
  description: 'All sixteen Formline posters, filter by collection or search by name.',
  path: '/shop/',
})

export default function ShopPage() {
  return <ShopClient products={PRODUCTS} />
}
