import { Poster } from '@/posters/Poster'
import { cn } from 'cn'
import type { Palette, PosterSpec } from '@/posters/types'

export function PosterFrame({
  spec,
  palette,
  label,
  className,
}: {
  spec: PosterSpec
  palette: Palette
  label: string
  className?: string
}) {
  return (
    <div className={cn('aspect-[1000/1414] w-full overflow-hidden rounded-md border border-border', className)}>
      <Poster
        spec={spec}
        palette={palette}
        rootProps={{ role: 'img', 'aria-label': label, width: '100%', height: '100%' }}
      />
    </div>
  )
}
