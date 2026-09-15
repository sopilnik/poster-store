import type { ReactElement } from 'react'
import type { OrbitParams, Palette } from '../types'
import type { RootProps } from '../Poster'
import { mulberry32 } from '../prng'

const W = 1000
const H = 1414
const r = (n: number) => Math.round(n * 10) / 10

export function Orbit({
  params,
  palette,
  rootProps,
}: {
  params: OrbitParams
  palette: Palette
  rootProps?: RootProps
}) {
  const { rings, offset, seed } = params
  const rand = mulberry32(seed)
  const baseCx = W / 2 + offset * 300
  const baseCy = H / 2 - offset * 200
  const unit = (W * 0.9) / rings
  const shifts: { dx: number; dy: number }[] = []
  for (let i = 0; i < rings; i++) {
    shifts.push({ dx: (rand() * 2 - 1) * 24, dy: (rand() * 2 - 1) * 24 })
  }
  const accentIndex = Math.floor(rand() * rings)
  const circles: ReactElement[] = []
  let ringNumber = 1
  for (const shift of shifts) {
    const radius = ringNumber * unit
    const strokeWidth = rings > 1 ? 18 + ((4 - 18) * (ringNumber - 1)) / (rings - 1) : 18
    const cx = baseCx + shift.dx
    const cy = baseCy + shift.dy
    const color = ringNumber - 1 === accentIndex ? palette.accent : palette.ink
    circles.push(
      <circle key={ringNumber} cx={r(cx)} cy={r(cy)} r={r(radius)} fill="none" stroke={color} strokeWidth={r(strokeWidth)} />,
    )
    ringNumber++
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1414" width="1000" height="1414" role="img" {...rootProps}>
      <rect x="0" y="0" width="1000" height="1414" fill={palette.background} />
      {circles}
    </svg>
  )
}
