import type { ReactElement } from 'react'
import type { OrbitParams, Palette, RootProps } from '../types'
import { mulberry32 } from '../prng'
import { W, H, r, PosterRoot } from '../canvas'

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
  const step = 440 / rings
  const wobble = Math.min(24, Math.max(0, (step - 18) / 3))
  const shifts: { dx: number; dy: number }[] = []
  for (let i = 0; i < rings; i++) {
    shifts.push({ dx: (rand() * 2 - 1) * wobble, dy: (rand() * 2 - 1) * wobble })
  }
  const accentIndex = Math.floor(rand() * rings)
  const circles: ReactElement[] = []
  let ringNumber = 1
  for (const shift of shifts) {
    const radius = ringNumber * step
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
    <PosterRoot background={palette.background} rootProps={rootProps}>
      {circles}
    </PosterRoot>
  )
}
