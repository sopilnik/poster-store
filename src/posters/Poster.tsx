import type { PosterSpec, Palette, RootProps } from './types'
import { Typographic } from './templates/typographic'
import { Grid } from './templates/grid'
import { Stripes } from './templates/stripes'
import { Orbit } from './templates/orbit'
import { Blocks } from './templates/blocks'

export type { RootProps } from './types'

export function Poster({
  spec,
  palette,
  rootProps,
}: {
  spec: PosterSpec
  palette: Palette
  rootProps?: RootProps
}) {
  switch (spec.template) {
    case 'typographic':
      return <Typographic params={spec.params} palette={palette} rootProps={rootProps} />
    case 'grid':
      return <Grid params={spec.params} palette={palette} rootProps={rootProps} />
    case 'stripes':
      return <Stripes params={spec.params} palette={palette} rootProps={rootProps} />
    case 'orbit':
      return <Orbit params={spec.params} palette={palette} rootProps={rootProps} />
    case 'blocks':
      return <Blocks params={spec.params} palette={palette} rootProps={rootProps} />
  }
}
