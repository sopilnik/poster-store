import type { ReactElement } from 'react'
import type { BlocksParams, Palette, RootProps } from '../types'
import { mulberry32 } from '../prng'
import { W, H, M, r, PosterRoot } from '../canvas'

// A quarter circle pinned at (cx, cy): the arc runs from the point directly left of the pivot
// to the point directly above it, then closes back through the pivot itself.
function quarterPath(cx: number, cy: number, radius: number): string {
  return `M ${r(cx - radius)} ${r(cy)} A ${r(radius)} ${r(radius)} 0 0 1 ${r(cx)} ${r(cy - radius)} L ${r(cx)} ${r(cy)} Z`
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
  const { layout, seed } = params
  const rand = mulberry32(seed)
  const jitter = (base: number) => base * (1 + (rand() * 2 - 1) * 0.06)
  const shapes: ReactElement[] = []

  if (layout === 'corner') {
    const cornerRadius = jitter(500)
    shapes.push(<path key="quarter" d={quarterPath(W, H, cornerRadius)} fill={palette.accent} />)
    const aw = jitter(300)
    const ah = jitter(180)
    shapes.push(<rect key="a" x={M} y={M} width={r(aw)} height={r(ah)} fill={palette.accent} />)
    const bw = jitter(180)
    const bh = jitter(300)
    shapes.push(<rect key="b" x={M} y={r(M + 220)} width={r(bw)} height={r(bh)} fill={palette.ink} />)
    const cw = jitter(260)
    const ch = jitter(160)
    shapes.push(<rect key="c" x={r(M + 220)} y={r(M + 220)} width={r(cw)} height={r(ch)} fill={palette.ink} />)
  } else if (layout === 'stack') {
    const available = H - 2 * M
    const fractions = [0.32, 0.16, 0.34, 0.18]
    let y = M
    let bandIndex = 0
    for (const fraction of fractions) {
      const height = jitter(fraction * available)
      const color = bandIndex === 1 || bandIndex === 3 ? palette.accent : palette.ink
      shapes.push(<rect key={`band-${bandIndex}`} x={M} y={r(y)} width={r(W - 2 * M)} height={r(height)} fill={color} />)
      y += height
      bandIndex++
    }
    const cornerRadius = jitter(180)
    shapes.push(<path key="quarter" d={quarterPath(W - M, H - M, cornerRadius)} fill={palette.ink} />)
  } else {
    const gap = 64
    const fieldHeight = H - 2 * M
    const totalFieldWidth = W - 2 * M - gap
    const leftWidth = jitter(totalFieldWidth / 2)
    const rightWidth = totalFieldWidth - leftWidth
    const rightX = M + leftWidth + gap
    shapes.push(<rect key="left" x={M} y={M} width={r(leftWidth)} height={r(fieldHeight)} fill={palette.accent} />)
    shapes.push(<rect key="right" x={r(rightX)} y={M} width={r(rightWidth)} height={r(fieldHeight)} fill={palette.accent} />)
    const bridgeRadius = jitter(140)
    const bridgeCx = rightX + bridgeRadius / 2
    shapes.push(<path key="quarter" d={quarterPath(bridgeCx, H / 2, bridgeRadius)} fill={palette.ink} />)
  }

  return (
    <PosterRoot background={palette.background} rootProps={rootProps}>
      {shapes}
    </PosterRoot>
  )
}
