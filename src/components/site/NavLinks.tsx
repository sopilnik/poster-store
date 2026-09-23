'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'cn'
import { COLLECTIONS } from '@/catalog/collections'

function trim(path: string): string {
  return path.replace(/\/+$/, '')
}

type NavLinksProps = {
  linkClassName?: string
}

export function NavLinks({ linkClassName }: NavLinksProps) {
  const pathname = usePathname()
  const isCurrent = (href: string) => trim(pathname) === trim(href)

  return (
    <>
      <Link
        href="/shop/"
        className={cn(linkClassName, isCurrent('/shop/') && 'text-primary')}
        aria-current={isCurrent('/shop/') ? 'page' : undefined}
      >
        Shop
      </Link>
      {COLLECTIONS.map(c => {
        const href = `/collections/${c.slug}/`
        return (
          <Link
            key={c.slug}
            href={href}
            className={cn(linkClassName, isCurrent(href) && 'text-primary')}
            aria-current={isCurrent(href) ? 'page' : undefined}
          >
            {c.name}
          </Link>
        )
      })}
    </>
  )
}
