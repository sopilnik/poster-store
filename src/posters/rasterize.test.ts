// @vitest-environment node
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { rasterize } from './rasterize'
import { renderPosterMarkup } from './markup'
import { productBySlug } from '@/catalog/products'
import { PALETTES } from '@/catalog/palettes'

const golden = new URL('./__golden__/quiet-hours-paper.png', import.meta.url)
const actualPath = join(process.cwd(), 'test-results', 'quiet-hours-paper.actual.png')

test('rasterised text poster matches the golden PNG', () => {
  const png = rasterize(renderPosterMarkup(productBySlug('quiet-hours')!, PALETTES.paper), { width: 360 })
  if (process.env.UPDATE_GOLDEN) {
    mkdirSync(new URL('./__golden__/', import.meta.url), { recursive: true })
    writeFileSync(golden, png)
  }
  expect(existsSync(golden)).toBe(true)
  const same = Buffer.compare(png, readFileSync(golden)) === 0
  if (!same) {
    mkdirSync(join(process.cwd(), 'test-results'), { recursive: true })
    writeFileSync(actualPath, png)
  }
  expect(same, `rendered PNG differs from the golden; see ${actualPath} (golden: ${golden.pathname})`).toBe(true)
})
