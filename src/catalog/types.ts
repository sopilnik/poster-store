import type { PosterSpec, PaletteId } from '@/posters/types'

export type CollectionSlug = 'monochrome' | 'primary' | 'pastel' | 'night'
export type Collection = { slug: CollectionSlug; name: string; description: string; representative: string }
export type SizeId = 'a3' | 'a2' | 'a1'
export type Size = { id: SizeId; label: 'A3' | 'A2' | 'A1'; cm: string; surchargeCents: number }
export type Product = { slug: string; name: string; collection: CollectionSlug; palettes: [PaletteId, ...PaletteId[]]; basePriceCents: number; description: string; tags: string[]; featured?: boolean } & PosterSpec
export type Variant = { productSlug: string; sizeId: SizeId; paletteId: PaletteId }
