import type { TypographicParams, Palette, RootProps } from '../types'
import { W, H, M, r, PosterRoot } from '../canvas'

const ANCHOR_X: Record<TypographicParams['align'], number> = { start: M, middle: W / 2, end: W - M }

export function Typographic({
  params,
  palette,
  rootProps,
}: {
  params: TypographicParams
  palette: Palette
  rootProps?: RootProps
}) {
  const { text, weight, align, scale, rule } = params
  const x = ANCHOR_X[align]
  const fontSize = r(300 * scale)
  const textY = r(H * 0.58)
  const ruleY = r(H * 0.62)
  const ruleWidth = r(W - 2 * M)
  const labelY = H - M

  return (
    <PosterRoot background={palette.background} rootProps={rootProps}>
      <text
        x={x}
        y={textY}
        textAnchor={align}
        fill={palette.ink}
        fontFamily="Space Grotesk"
        fontSize={fontSize}
        fontWeight={weight}
        letterSpacing={-8}
      >
        {text}
      </text>
      {rule ? <rect x={M} y={ruleY} width={ruleWidth} height="6" fill={palette.accent} /> : null}
      <text x={M} y={labelY} textAnchor="start" fill={palette.ink} fontFamily="Space Grotesk" fontSize="28" fontWeight={400}>
        {text.toLowerCase()}
      </text>
    </PosterRoot>
  )
}
