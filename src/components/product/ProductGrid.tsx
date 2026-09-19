import { ProductCard } from './ProductCard'
import type { Product } from '@/catalog/types'

export function ProductGrid({ products, eager = 0 }: { products: Product[]; eager?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.slug} product={product} eager={index < eager} />
      ))}
    </div>
  )
}
