import Link from 'next/link'

export function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
            {i < items.length - 1 && <span aria-hidden="true">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}
