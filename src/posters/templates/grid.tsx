import type { ReactElement } from 'react'
import type { GridParams, Palette, RootProps } from '../types'
import { mulberry32 } from '../prng'
import { W, H, M, r, PosterRoot } from '../canvas'

export function Grid({
  params,
  palette,
  rootProps,
}: {
  params: GridParams
  palette: Palette
  rootProps?: RootProps
}) {
  const { columns, rows, density, seed } = params
  const rand = mulberry32(seed)
  const cell = (W - 2 * M) / columns
  const cellH = (H - 2 * M) / rows
  const inset = cell * 0.12
  const insetH = cellH * 0.12
  const shapes: ReactElement[] = []
  let cellIndex = 0
  let drawnCount = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const cellX = M + col * cell
      const cellY = M + row * cellH
      if (rand() < density) {
        drawnCount++
        const color = drawnCount % 7 === 0 ? palette.accent : palette.ink
        if ((row + col) % 2 === 0) {
          shapes.push(
            <circle key={cellIndex} cx={r(cellX + cell / 2)} cy={r(cellY + cellH / 2)} r={r(cell * 0.38)} fill={color} />,
          )
        } else {
          shapes.push(
            <rect
              key={cellIndex}
              x={r(cellX + inset)}
              y={r(cellY + insetH)}
              width={r(cell - 2 * inset)}
              height={r(cellH - 2 * insetH)}
              fill={color}
            />,
          )
        }
      }
      cellIndex++
    }
  }
  return (
    <PosterRoot background={palette.background} rootProps={rootProps}>
      {shapes}
    </PosterRoot>
  )
}
