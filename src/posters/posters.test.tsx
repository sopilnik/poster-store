import { renderPosterMarkup } from './markup'
import { PRODUCTS } from '@/catalog/products'
import { PALETTES } from '@/catalog/palettes'
const allowedAttrs = /\s(class|style)=|var\(/
const hex = /#[0-9a-fA-F]{3,8}\b/g
test.each(PRODUCTS.map(p => [p.slug, p] as const))('%s renders a standalone, deterministic, palette-only SVG', (_, p) => {
  const palette = PALETTES[p.palettes[0]]
  const a = renderPosterMarkup(p, palette), b = renderPosterMarkup(p, palette)
  expect(a).toBe(b)
  expect(a.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1414"')).toBe(true)
  expect(a).not.toMatch(allowedAttrs)
  const allowed = new Set([palette.background, palette.ink, palette.accent].map(c => c.toLowerCase()))
  for (const c of a.match(hex) ?? []) expect(allowed.has(c.toLowerCase())).toBe(true)
  expect(a).not.toMatch(/font-weight="(?!400|700)/)
})
