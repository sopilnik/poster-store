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

  const links = [
    { href: '/shop/', label: 'Shop' },
    ...COLLECTIONS.map(c => ({ href: `/collections/${c.slug}/`, label: c.name })),
  ]

  return (
    <>
      {links.map(({ href, label }) => {
        const current = isCurrent(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(linkClassName, current && 'text-primary')}
            aria-current={current ? 'page' : undefined}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
