import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { PosterSpec, Palette } from './types'
import { Poster } from './Poster'

export function renderPosterMarkup(spec: PosterSpec, palette: Palette): string {
  return renderToStaticMarkup(createElement(Poster, { spec, palette }))
}
