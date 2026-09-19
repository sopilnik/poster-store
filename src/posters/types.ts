import type { SVGProps } from 'react'

export type TemplateId = 'typographic' | 'grid' | 'stripes' | 'orbit' | 'blocks'
export type TypographicParams = { text: string; weight: 400 | 700; align: 'start' | 'middle' | 'end'; scale: number; rule: boolean }
export type GridParams = { columns: number; rows: number; density: number; seed: number }
export type StripesParams = { count: number; angle: 0 | 30 | 90; numeral: string }
export type OrbitParams = { rings: number; offset: number; seed: number }
export type BlocksParams = { layout: 'corner' | 'stack' | 'split'; seed: number }
export type PosterSpec =
  | { template: 'typographic'; params: TypographicParams } | { template: 'grid'; params: GridParams }
  | { template: 'stripes'; params: StripesParams } | { template: 'orbit'; params: OrbitParams }
  | { template: 'blocks'; params: BlocksParams }
export type ParamsFor<K extends TemplateId> = Extract<PosterSpec, { template: K }>['params']
export type Palette = { id: PaletteId; name: string; background: string; ink: string; accent: string }
export type PaletteId = 'paper' | 'ink' | 'signal' | 'ocean' | 'sage' | 'sand'
export type RootProps = Partial<
  Pick<SVGProps<SVGSVGElement>, 'className' | 'width' | 'height' | 'aria-label' | 'aria-hidden' | 'role' | 'x' | 'y'>
>
