'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { BRAND } from '@/lib/site'
import { Button } from '@/components/ui/button'
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { NavLinks } from './NavLinks'

export function MobileMenu() {
  // Keying the sheet by the route remounts it, and therefore closes it, on every navigation:
  // a client-side route change never leaves it open over the next page (unlike an
  // uncontrolled Sheet, which keeps its internal state across a route change).
  const pathname = usePathname()

  return (
    <Sheet key={pathname}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="relative after:absolute after:-inset-y-1.5 after:-inset-x-px md:hidden"
          />
        }
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{BRAND}</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="flex flex-col gap-4 px-4">
          <NavLinks />
        </nav>
      </SheetContent>
    </Sheet>
  )
}
