import type { TypographicParams, Palette, RootProps } from '../types'
import { W, H, M, r, PosterRoot } from '../canvas'

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
  const x = align === 'start' ? M : align === 'end' ? W - M : W / 2
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
