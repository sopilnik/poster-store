import { Resvg } from '@resvg/resvg-js'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const fontDir = fileURLToPath(new URL('../../public/fonts/', import.meta.url))
const fontFiles = [path.join(fontDir, 'SpaceGrotesk-Regular.ttf'), path.join(fontDir, 'SpaceGrotesk-Bold.ttf')]
for (const file of fontFiles) {
  if (!existsSync(file)) throw new Error(`missing font file: ${file}`)
}
const options = {
  font: {
    fontFiles,
    loadSystemFonts: false,
    defaultFontFamily: 'Space Grotesk',
  },
  logLevel: 'error' as const,
}

export function rasterize(svg: string, opts: { width: number }): Buffer {
  return Buffer.from(new Resvg(svg, { ...options, fitTo: { mode: 'width', value: opts.width } }).render().asPng())
}
