import { markerPercent, type BandTrack } from '@/lib/bands'
import { markerShift } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { BAND_TONE_CLASS, bandColor } from './tone'

export function MiniRuler({
  track,
  value,
  preview = false,
  className,
}: {
  track: BandTrack
  value?: number | null
  /** Draw the band colors with no marker. Used when a scale has class bands but no GPA yet. */
  preview?: boolean
  className?: string
}) {
  const graded = typeof value === 'number' && Number.isFinite(value)
  if (!graded && !preview) {
    return (
      <div
        className={cn('h-1.5 w-full rounded-full border border-dashed border-foreground/25', className)}
        aria-hidden="true"
      />
    )
  }

  const span = track.max - track.min
  return (
    <div
      className={cn('relative h-1.5 w-full', className)}
      role="img"
      aria-label={graded ? `GPA ${value.toFixed(2)}` : 'Classification scale'}
    >
      <div className="flex h-full overflow-hidden rounded-full">
        {track.bands.map((band, index) => {
          const width = span > 0 ? ((band.max - band.min) / span) * 100 : 0
          const plain = band.tone === 'plain'
          return (
            <div
              key={band.id}
              className={cn('h-full', plain && BAND_TONE_CLASS.plain)}
              style={{ width: `${width}%`, backgroundColor: plain ? undefined : bandColor(index, track.bands.length) }}
            />
          )
        })}
      </div>
      {graded ? (
        <span
          className={cn('absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-foreground', markerShift)}
          style={{ left: `${markerPercent(value, track)}%` }}
        />
      ) : null}
    </div>
  )
}
