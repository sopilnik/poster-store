import { AUTHOR_NAME, BRAND, REPO_URL } from '@/lib/site'
import { AUTHOR_URL } from '@/lib/siteServer'

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{BRAND} is a demo store. Orders are not real and nothing is charged.</p>
        <div className="flex items-center gap-4">
          <a href={REPO_URL} target="_blank" rel="noopener" className="hover:text-foreground">
            Source on GitHub
          </a>
          <a href={AUTHOR_URL} target="_blank" rel="noopener" className="hover:text-foreground">
            Built by {AUTHOR_NAME}
          </a>
        </div>
      </div>
    </footer>
  )
}
