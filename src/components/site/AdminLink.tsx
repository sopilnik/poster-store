import { ArrowUpRight, LayoutDashboard } from 'lucide-react'
import { ADMIN_URL } from '@/lib/site'

// Links to the store's admin panel demo, set apart from the shop links by color and icon. Below 1024 px it shows the
// icon alone, so it still fits beside the collection links; below 360 px it is hidden, and the footer link remains.
export function AdminLink() {
  return (
    <a
      href={ADMIN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative inline-flex h-9 min-w-9 items-center justify-center gap-1.5 text-sm font-semibold text-primary after:absolute after:-inset-x-px after:-inset-y-1 hover:underline hover:underline-offset-4 max-[360px]:hidden"
    >
      <LayoutDashboard aria-hidden="true" className="size-4" />
      <span className="sr-only lg:not-sr-only">Admin panel</span>
      <ArrowUpRight aria-hidden="true" className="hidden size-3.5 opacity-75 lg:block" />
    </a>
  )
}
