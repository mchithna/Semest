import { markerPercent, type BandTrack } from '@/lib/bands'
import { cn } from '@/lib/utils'
import { BAND_TONE_CLASS } from './tone'

export function MiniRuler({
  track,
  value,
  className,
}: {
  track: BandTrack
  value?: number | null
  className?: string
}) {
  const graded = typeof value === 'number' && Number.isFinite(value)
  if (!graded) {
    return (
      <div
        className={cn('h-1.5 w-full rounded-full border border-dashed border-foreground/25', className)}
        aria-hidden="true"
      />
    )
  }

  const span = track.max - track.min
  return (
    <div className={cn('relative h-1.5 w-full', className)} role="img" aria-label={`GPA ${value.toFixed(2)}`}>
      <div className="flex h-full overflow-hidden rounded-full">
        {track.bands.map((band) => {
          const width = span > 0 ? ((band.max - band.min) / span) * 100 : 0
          return (
            <div
              key={band.id}
              className={cn('h-full', BAND_TONE_CLASS[band.tone])}
              style={{ width: `${width}%` }}
            />
          )
        })}
      </div>
      <span
        className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-foreground"
        style={{ left: `${markerPercent(value, track)}%` }}
      />
    </div>
  )
}
