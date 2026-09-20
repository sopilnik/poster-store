import Link from 'next/link'
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import { BRAND } from '@/lib/site'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground">{BRAND}</p>
      <h1 className="text-2xl font-bold tracking-tight">This page does not exist.</h1>
      <div className="flex gap-3">
        <Link href="/" className={cn(buttonVariants())}>
          Home
        </Link>
        <Link href="/shop/" className={cn(buttonVariants({ variant: 'outline' }))}>
          Shop
        </Link>
      </div>
    </div>
  )
}
