import { ArrowUpRight } from 'lucide-react'
import { ADMIN_URL, AUTHOR_NAME, BRAND, REPO_URL } from '@/lib/site'
import { AUTHOR_URL } from '@/lib/siteServer'

// Every footer link leaves the store, so each opens in a new tab and says so with an arrow.
const FOOTER_LINKS = [
  { href: ADMIN_URL, label: 'Admin panel demo' },
  { href: REPO_URL, label: 'Source on GitHub' },
  { href: AUTHOR_URL, label: `Built by ${AUTHOR_NAME}` },
]

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
        <p>{BRAND} is a demo store. Orders are not real and nothing is charged.</p>
        {/* On a phone the links stack, and below 1024 px the sentence sits above them, so no link wraps. */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
          {FOOTER_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              {link.label}
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
