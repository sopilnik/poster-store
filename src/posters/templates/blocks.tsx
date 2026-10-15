import type { ReactElement } from 'react'
import type { BlocksParams, Palette, RootProps } from '../types'
import { mulberry32 } from '../prng'
import { W, H, M, r, PosterRoot } from '../canvas'

// jitter() moves a base size by up to this share either way; the block offset and the split gap stay fixed.
const JITTER_SPREAD = 0.06
// Corner: a large quarter circle in the bottom-right corner and three blocks from the top-left margin.
const CORNER_RADIUS = 500
const BLOCK_A = { width: 300, height: 180 }
const BLOCK_B = { width: 180, height: 300 }
const BLOCK_C = { width: 260, height: 160 }
const BLOCK_OFFSET = 220
// Stack: four full-width bands, the second and the fourth in the accent color, and a small quarter circle.
const STACK_FRACTIONS = [0.32, 0.16, 0.34, 0.18]
const ACCENT_BANDS = new Set([1, 3])
const STACK_RADIUS = 180
// Split: two fields with a gap between them and a quarter circle bridging it.
const SPLIT_GAP = 64
const BRIDGE_RADIUS = 140

type Jitter = (base: number) => number

// A quarter circle pinned at (cx, cy): the arc runs from the point directly left of the pivot
// to the point directly above it, then closes back through the pivot itself.
function quarterPath(cx: number, cy: number, radius: number): string {
  return `M ${r(cx - radius)} ${r(cy)} A ${r(radius)} ${r(radius)} 0 0 1 ${r(cx)} ${r(cy - radius)} L ${r(cx)} ${r(cy)} Z`
}

function cornerShapes(jitter: Jitter, palette: Palette): ReactElement[] {
  const cornerRadius = jitter(CORNER_RADIUS)
  const aw = jitter(BLOCK_A.width)
  const ah = jitter(BLOCK_A.height)
  const bw = jitter(BLOCK_B.width)
  const bh = jitter(BLOCK_B.height)
  const cw = jitter(BLOCK_C.width)
  const ch = jitter(BLOCK_C.height)

  return [
    <path key="quarter" d={quarterPath(W, H, cornerRadius)} fill={palette.accent} />,
    <rect key="a" x={M} y={M} width={r(aw)} height={r(ah)} fill={palette.accent} />,
    <rect key="b" x={M} y={r(M + BLOCK_OFFSET)} width={r(bw)} height={r(bh)} fill={palette.ink} />,
    <rect key="c" x={r(M + BLOCK_OFFSET)} y={r(M + BLOCK_OFFSET)} width={r(cw)} height={r(ch)} fill={palette.ink} />,
  ]
}

function stackShapes(jitter: Jitter, palette: Palette): ReactElement[] {
  const available = H - 2 * M
  const shapes: ReactElement[] = []
  let y = M

  STACK_FRACTIONS.forEach((fraction, bandIndex) => {
    const height = jitter(fraction * available)
    const color = ACCENT_BANDS.has(bandIndex) ? palette.accent : palette.ink

    shapes.push(<rect key={`band-${bandIndex}`} x={M} y={r(y)} width={r(W - 2 * M)} height={r(height)} fill={color} />)
    y += height
  })

  const cornerRadius = jitter(STACK_RADIUS)

  shapes.push(<path key="quarter" d={quarterPath(W - M, H - M, cornerRadius)} fill={palette.ink} />)

  return shapes
}

function splitShapes(jitter: Jitter, palette: Palette): ReactElement[] {
  const fieldHeight = H - 2 * M
  const totalFieldWidth = W - 2 * M - SPLIT_GAP
  const leftWidth = jitter(totalFieldWidth / 2)
  const rightWidth = totalFieldWidth - leftWidth
  const rightX = M + leftWidth + SPLIT_GAP
  const bridgeRadius = jitter(BRIDGE_RADIUS)
  const bridgeCx = rightX + bridgeRadius / 2

  return [
    <rect key="left" x={M} y={M} width={r(leftWidth)} height={r(fieldHeight)} fill={palette.accent} />,
    <rect key="right" x={r(rightX)} y={M} width={r(rightWidth)} height={r(fieldHeight)} fill={palette.accent} />,
    <path key="quarter" d={quarterPath(bridgeCx, H / 2, bridgeRadius)} fill={palette.ink} />,
  ]
}

const LAYOUT_SHAPES: Record<BlocksParams['layout'], (jitter: Jitter, palette: Palette) => ReactElement[]> = {
  corner: cornerShapes,
  stack: stackShapes,
  split: splitShapes,
}

export function Blocks({
  params,
  palette,
  rootProps,
}: {
  params: BlocksParams
  palette: Palette
  rootProps?: RootProps
}) {
  const rand = mulberry32(params.seed)
  const jitter = (base: number) => base * (1 + (rand() * 2 - 1) * JITTER_SPREAD)
  const shapes = LAYOUT_SHAPES[params.layout](jitter, palette)

  return (
    <PosterRoot background={palette.background} rootProps={rootProps}>
      {shapes}
    </PosterRoot>
  )
}
