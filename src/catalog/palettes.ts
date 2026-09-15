import type { Palette, PaletteId } from '../posters/types'

export type { Palette, PaletteId }

export const PALETTES = {
  paper:  { id: 'paper',  name: 'Paper',  background: '#F4F1EA', ink: '#14110F', accent: '#D94E1F' },
  ink:    { id: 'ink',    name: 'Ink',    background: '#14110F', ink: '#F4F1EA', accent: '#E9C46A' },
  signal: { id: 'signal', name: 'Signal', background: '#D62828', ink: '#FFF8F0', accent: '#14110F' },
  ocean:  { id: 'ocean',  name: 'Ocean',  background: '#1D3557', ink: '#F1FAEE', accent: '#E63946' },
  sage:   { id: 'sage',   name: 'Sage',   background: '#CFE1D2', ink: '#1F3A2A', accent: '#E07A5F' },
  sand:   { id: 'sand',   name: 'Sand',   background: '#E8D8C3', ink: '#3B2F2F', accent: '#2A9D8F' },
} as const satisfies Record<PaletteId, Palette>
