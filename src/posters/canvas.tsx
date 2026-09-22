import type { ReactNode } from 'react'
import type { RootProps } from './types'

export const W = 1000
export const H = 1414
export const M = 80
export const r = (n: number) => Math.round(n * 10) / 10

export function PosterRoot({
  background,
  rootProps,
  children,
}: {
  background: string
  rootProps?: RootProps
  children?: ReactNode
}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1414" width="1000" height="1414" role="img" {...rootProps}>
      <rect x="0" y="0" width="1000" height="1414" fill={background} />
      {children}
    </svg>
  )
}
