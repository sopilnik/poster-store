// @vitest-environment node
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { rasterize } from './rasterize'
import { renderPosterMarkup } from './markup'
import { productBySlug } from '@/catalog/products'
import { PALETTES } from '@/catalog/palettes'

const golden = new URL('./__golden__/quiet-hours-paper.png', import.meta.url)

test('rasterised text poster matches the golden PNG', () => {
  const png = rasterize(renderPosterMarkup(productBySlug('quiet-hours')!, PALETTES.paper), { width: 360 })
  if (process.env.UPDATE_GOLDEN) writeFileSync(golden, png)
  expect(existsSync(golden)).toBe(true)
  expect(Buffer.compare(png, readFileSync(golden))).toBe(0)
})
