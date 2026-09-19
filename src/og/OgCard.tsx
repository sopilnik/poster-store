import { renderToStaticMarkup } from 'react-dom/server'
import { Poster } from '../posters/Poster'
import type { Palette, PosterSpec } from '../posters/types'

const CARD_BACKGROUND = '#F4F1EA'
const CARD_TITLE = '#14110F'
const CARD_PRICE = '#D94E1F'

function PosterBlock({ poster, palette }: { poster?: PosterSpec; palette?: Palette }) {
  if (!poster || !palette) return null
  const fit = Math.min(340 / 1000, 550 / 1414)
  const width = 1000 * fit
  const height = 1414 * fit
  const x = 40 + (340 - width) / 2
  const y = 40 + (550 - height) / 2
  return <Poster spec={poster} palette={palette} rootProps={{ x, y, width, height }} />
}

export function OgCard({
  title,
  subtitle,
  priceLabel,
  poster,
  palette,
}: {
  title: string
  subtitle: string
  priceLabel: string
  poster?: PosterSpec
  palette?: Palette
}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
      <rect x="0" y="0" width="1200" height="630" fill={CARD_BACKGROUND} />
      <PosterBlock poster={poster} palette={palette} />
      <text x="460" y="260" fontFamily="Space Grotesk" fontSize="64" fontWeight={700} fill={CARD_TITLE}>
        {title}
      </text>
      <text x="460" y="310" fontFamily="Space Grotesk" fontSize="30" fontWeight={400} fill={CARD_TITLE}>
        {subtitle}
      </text>
      {priceLabel ? (
        <text x="460" y="380" fontFamily="Space Grotesk" fontSize="36" fontWeight={700} fill={CARD_PRICE}>
          {priceLabel}
        </text>
      ) : null}
      <text x="1140" y="590" textAnchor="end" fontFamily="Space Grotesk" fontSize="28" fontWeight={700} fill={CARD_TITLE}>
        Formline
      </text>
    </svg>
  )
}

export function ogCardMarkup({
  title,
  subtitle,
  priceLabel,
  poster,
  palette,
}: {
  title: string
  subtitle: string
  priceLabel: string
  poster?: PosterSpec
  palette?: Palette
}): string {
  return renderToStaticMarkup(
    <OgCard title={title} subtitle={subtitle} priceLabel={priceLabel} poster={poster} palette={palette} />,
  )
}
