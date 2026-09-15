import type { ComponentType } from 'react'
import type { TemplateId, ParamsFor, Palette, RootProps } from './types'
import { Typographic } from './templates/typographic'
import { Grid } from './templates/grid'
import { Stripes } from './templates/stripes'
import { Orbit } from './templates/orbit'
import { Blocks } from './templates/blocks'

export const REGISTRY = {
  typographic: Typographic,
  grid: Grid,
  stripes: Stripes,
  orbit: Orbit,
  blocks: Blocks,
} as const satisfies { [K in TemplateId]: ComponentType<{ params: ParamsFor<K>; palette: Palette; rootProps?: RootProps }> }
