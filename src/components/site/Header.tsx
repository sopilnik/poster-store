import Link from 'next/link'
import { BRAND } from '@/lib/site'
import { ThemeToggle } from './ThemeToggle'
import { CartButton } from './CartButton'
import { MobileMenu } from './MobileMenu'
import { NavLinks } from './NavLinks'

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-heading text-lg font-bold">
          {BRAND}
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          <NavLinks linkClassName="hover:text-primary" />
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <CartButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}
