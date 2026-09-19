import { Resvg } from '@resvg/resvg-js'
import path from 'node:path'

const fontDir = path.resolve(process.cwd(), 'public/fonts')
const options = {
  font: {
    fontFiles: [path.join(fontDir, 'SpaceGrotesk-Regular.ttf'), path.join(fontDir, 'SpaceGrotesk-Bold.ttf')],
    loadSystemFonts: false,
    defaultFontFamily: 'Space Grotesk',
  },
  logLevel: 'error' as const,
}

export function rasterize(svg: string, opts: { width: number }): Buffer {
  return Buffer.from(new Resvg(svg, { ...options, fitTo: { mode: 'width', value: opts.width } }).render().asPng())
}
