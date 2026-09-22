import type { Metadata } from 'next'
import { BRAND } from './site'
import { absoluteUrl } from './siteServer'

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
  // The root layout's title template ("%s · Formline") applies to descendant segments only,
  // never to the root page itself; returning the title as absolute opts every page here out
  // of the template so the suffix is never appended twice.
  const fullTitle = `${title} · ${BRAND}`
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
  }
}
