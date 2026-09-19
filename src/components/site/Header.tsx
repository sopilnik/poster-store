import Link from 'next/link'
import { Menu } from 'lucide-react'
import { COLLECTIONS } from '@/catalog/collections'
import { BRAND } from '@/lib/site'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from './ThemeToggle'
import { CartButton } from './CartButton'

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-heading text-lg font-bold">
          {BRAND}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          <Link href="/shop/" className="hover:text-primary">
            Shop
          </Link>
          {COLLECTIONS.map(c => (
            <Link key={c.slug} href={`/collections/${c.slug}/`} className="hover:text-primary">
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <CartButton />
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" aria-label="Menu" className="md:hidden" />}
            >
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{BRAND}</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-4 px-4">
                <Link href="/shop/">Shop</Link>
                {COLLECTIONS.map(c => (
                  <Link key={c.slug} href={`/collections/${c.slug}/`}>
                    {c.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
