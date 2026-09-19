import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BRAND } from '@/lib/site'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">{BRAND}</p>
      <h1 className="text-2xl font-bold tracking-tight">This page does not exist.</h1>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/">Home</Link>} />
        <Button variant="outline" nativeButton={false} render={<Link href="/shop/">Shop</Link>} />
      </div>
    </div>
  )
}
