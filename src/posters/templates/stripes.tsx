import type { ReactElement } from 'react'
import type { StripesParams, Palette, RootProps } from '../types'
import { W, H, r, PosterRoot } from '../canvas'

export function Stripes({
  params,
  palette,
  rootProps,
}: {
  params: StripesParams
  palette: Palette
  rootProps?: RootProps
}) {
  const { count, angle, numeral } = params
  const bands: ReactElement[] = []
  if (angle === 0) {
    const bandHeight = H / count
    for (let i = 0; i < count; i++) {
      bands.push(
        <rect key={i} x="0" y={r(i * bandHeight)} width={W} height={r(bandHeight)} fill={i % 2 === 0 ? palette.ink : 'none'} />,
      )
    }
  } else if (angle === 90) {
    const bandWidth = W / count
    for (let i = 0; i < count; i++) {
      bands.push(
        <rect key={i} x={r(i * bandWidth)} y="0" width={r(bandWidth)} height={H} fill={i % 2 === 0 ? palette.ink : 'none'} />,
      )
    }
  } else {
    const scale = 1.6
    const bigW = W * scale
    const bigH = H * scale
    const startX = (W - bigW) / 2
    const startY = (H - bigH) / 2
    const bandHeight = bigH / count
    for (let i = 0; i < count; i++) {
      bands.push(
        <rect
          key={i}
          x={r(startX)}
          y={r(startY + i * bandHeight)}
          width={r(bigW)}
          height={r(bandHeight)}
          fill={i % 2 === 0 ? palette.ink : 'none'}
        />,
      )
    }
  }
  const numeralSize = 520
  const numeralX = W / 2
  const numeralY = r(H / 2 + numeralSize * 0.35)
  return (
    <PosterRoot background={palette.background} rootProps={rootProps}>
      {angle === 30 ? <g transform="rotate(30 500 707)">{bands}</g> : bands}
      <text
        x={numeralX}
        y={numeralY}
        textAnchor="middle"
        fill={palette.accent}
        stroke={palette.background}
        strokeWidth="14"
        fontFamily="Space Grotesk"
        fontSize={numeralSize}
        fontWeight={700}
      >
        {numeral}
      </text>
    </PosterRoot>
  )
}
