import { Poster } from '@/posters/Poster'
import type { Palette, PosterSpec } from '@/posters/types'

export function PosterFrame({
  spec,
  palette,
  label,
}: {
  spec: PosterSpec
  palette: Palette
  label: string
}) {
  return (
    <div className="aspect-[1000/1414] w-full overflow-hidden rounded-md border border-border">
      <Poster
        spec={spec}
        palette={palette}
        rootProps={{ role: 'img', 'aria-label': label, width: '100%', height: '100%' }}
      />
    </div>
  )
}
