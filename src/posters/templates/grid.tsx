import type { ReactElement } from 'react'
import type { GridParams, Palette } from '../types'
import type { RootProps } from '../Poster'
import { mulberry32 } from '../prng'

const W = 1000
const H = 1414
const M = 80
const r = (n: number) => Math.round(n * 10) / 10

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
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1414" width="1000" height="1414" role="img" {...rootProps}>
      <rect x="0" y="0" width="1000" height="1414" fill={palette.background} />
      {shapes}
    </svg>
  )
}
