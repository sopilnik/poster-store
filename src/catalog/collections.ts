import type { Collection } from './types'

export const COLLECTIONS: Collection[] = [
  {
    slug: 'monochrome',
    name: 'Monochrome',
    representative: 'quiet-hours',
    description: 'Black, off-white and nothing else. Posters that behave in any room.',
  },
  {
    slug: 'primary',
    name: 'Primary',
    representative: 'red-corner',
    description: 'Red, navy and paper. The loud shelf of the shop: big shapes, big letters, colours that do not ask permission.',
  },
  {
    slug: 'pastel',
    name: 'Pastel',
    representative: 'morning-orbit',
    description: 'Sage and sand. Soft grounds, quiet geometry.',
  },
  {
    slug: 'night',
    name: 'Night',
    representative: 'after-dark',
    description: 'Dark grounds for dark walls. Ink black and deep navy, with one warm accent each.',
  },
]

export function collectionBySlug(slug: string): Collection | undefined {
  return COLLECTIONS.find(c => c.slug === slug)
}
