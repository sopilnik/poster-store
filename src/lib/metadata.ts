import type { Metadata } from 'next'
import { absoluteUrl, BRAND } from './site'

export function pageMetadata({
  title,
  description,
  path,
  image = '/og/default.png',
}: {
  title: string
  description: string
  path: string
  image?: string
}): Metadata {
  // The root layout's title template ("%s · Formline") only merges into a page's title when
  // an intermediate layout sits between the root and the page; this app has none, so the
  // template is applied here instead of left to Next's per-segment merge.
  return {
    title: `${title} · ${BRAND}`,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      images: [{ url: image, width: 1200, height: 630, alt: `${title} · ${BRAND}` }],
    },
  }
}
