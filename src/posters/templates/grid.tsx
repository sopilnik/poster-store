import type { ReactElement } from 'react'
import type { GridParams, Palette, RootProps } from '../types'
import { mulberry32 } from '../prng'
import { W, H, M, r, PosterRoot } from '../canvas'

const INSET_RATIO = 0.12
const DOT_RADIUS_RATIO = 0.38
const ACCENT_EVERY = 7

type CellBox = { x: number; y: number; width: number; height: number }

function cellShape(key: number, box: CellBox, { round, color }: { round: boolean; color: string }): ReactElement {
  if (round) {
    return <circle key={key} cx={r(box.x + box.width / 2)} cy={r(box.y + box.height / 2)} r={r(box.width * DOT_RADIUS_RATIO)} fill={color} />
  }

  const insetX = box.width * INSET_RATIO
  const insetY = box.height * INSET_RATIO

  return (
    <rect
      key={key}
      x={r(box.x + insetX)}
      y={r(box.y + insetY)}
      width={r(box.width - 2 * insetX)}
      height={r(box.height - 2 * insetY)}
      fill={color}
    />
  )
}

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
  const shapes: ReactElement[] = []
  let cellIndex = 0
  let drawnCount = 0

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const box = { x: M + col * cell, y: M + row * cellH, width: cell, height: cellH }

      if (rand() < density) {
        drawnCount++

        const color = drawnCount % ACCENT_EVERY === 0 ? palette.accent : palette.ink

        shapes.push(cellShape(cellIndex, box, { round: (row + col) % 2 === 0, color }))
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
