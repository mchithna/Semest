import { useLayoutEffect, useRef, useState } from 'react'
import {
  estimateLabelWidth,
  markerPercent,
  placeMarkers,
  type BandTrack,
  type RulerMarker,
} from '@/lib/bands'
import { cn } from '@/lib/utils'
import { BAND_TONE_CLASS } from './tone'

export function Ruler({
  track,
  markers = [],
  className,
}: {
  track: BandTrack
  markers?: RulerMarker[]
  className?: string
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const node = trackRef.current
    if (!node) return
    const measure = () => setWidth(node.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const measured = width || 800
  const placement = placeMarkers(markers, track, measured)
  const hasAbove = markers.some((marker) => placement.get(marker.id) === 'above')
  const hasBelow = markers.some((marker) => placement.get(marker.id) === 'below')
  const legend = markers.filter((marker) => placement.get(marker.id) === 'legend' && marker.kind !== 'dot')
  const ticks = visibleTicks(track, measured)
  const summary = markers.map((marker) => marker.label).filter(Boolean).join(', ')
    || track.bands.map((band) => band.label).filter(Boolean).join(', ')

  return (
    <figure className={cn('m-0 w-full', className)} aria-label={summary || 'Classification scale'}>
      <div className={cn('relative', hasAbove && 'pt-9')}>
        {hasAbove && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-8">
            {markers.map((marker) =>
              placement.get(marker.id) === 'above' ? (
                <MarkerPill key={marker.id} marker={marker} track={track} side="above" />
              ) : null,
            )}
          </div>
        )}

        <div ref={trackRef} className="relative h-10">
          <div className="flex h-full overflow-hidden rounded-full">
            {track.bands.map((band) => {
              const span = track.max - track.min
              const widthPct = span > 0 ? ((band.max - band.min) / span) * 100 : 0
              const segmentPx = (measured * widthPct) / 100
              const showLabel = Boolean(band.label) && segmentPx >= estimateLabelWidth(band.label)
              return (
                <div
                  key={band.id}
                  className={cn(
                    'flex h-full min-w-0 items-center px-3 text-xs font-medium text-primary-foreground',
                    BAND_TONE_CLASS[band.tone],
                  )}
                  style={{ width: `${widthPct}%` }}
                >
                  {showLabel ? <span className="truncate">{band.label}</span> : null}
                  {band.label && !showLabel ? <span className="sr-only">{band.label}</span> : null}
                </div>
              )
            })}
          </div>
          {markers.map((marker) => {
            const collapsed = placement.get(marker.id) === 'legend'
            if (marker.kind !== 'dot' && !collapsed) return null
            return (
              <span
                key={`${marker.id}-dot`}
                className="absolute top-[78%] size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-2 ring-foreground"
                style={{ left: `${markerPercent(marker.value, track)}%` }}
              />
            )
          })}
        </div>

        <div className="relative mt-2 h-4 text-[11px] tabular-nums text-muted-foreground">
          {ticks.map((tick) => (
            <span
              key={tick.value}
              className={cn('absolute', tickAlign(tick.percent))}
              style={tick.percent >= 100 ? undefined : { left: `${tick.percent}%` }}
            >
              {tick.value.toFixed(2)}
            </span>
          ))}
        </div>

        {hasBelow && (
          <div className="relative mt-1 h-16">
            {markers.map((marker) =>
              placement.get(marker.id) === 'below' ? (
                <MarkerPill key={marker.id} marker={marker} track={track} side="below" />
              ) : null,
            )}
          </div>
        )}
      </div>
      {legend.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{legend.map((marker) => marker.label).join(' · ')}</p>
      )}
    </figure>
  )
}

function MarkerPill({
  marker,
  track,
  side,
}: {
  marker: RulerMarker
  track: BandTrack
  side: 'above' | 'below'
}) {
  const target = marker.kind === 'target'
  return (
    <div
      className={cn('absolute flex -translate-x-1/2 flex-col items-center', side === 'above' ? 'bottom-0' : 'top-0')}
      style={{ left: `${markerPercent(marker.value, track)}%` }}
    >
      {side === 'below' && <Stem dashed={target} />}
      <span
        className={cn(
          'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
          target
            ? 'border border-band-first bg-background text-band-first'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {marker.label}
      </span>
      {side === 'above' && <Stem dashed={target} />}
    </div>
  )
}

function Stem({ dashed }: { dashed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn('h-3 w-px', dashed ? 'text-band-first' : 'bg-foreground')}
      style={dashed ? {
        backgroundImage: 'linear-gradient(to bottom, currentColor 2px, transparent 2px)',
        backgroundSize: '1px 4px',
      } : undefined}
    />
  )
}

function tickAlign(percent: number) {
  if (percent <= 0) return 'left-0'
  if (percent >= 100) return 'right-0'
  return '-translate-x-1/2'
}

function visibleTicks(track: BandTrack, width: number) {
  const values = [track.min, ...track.bands.map((band) => band.max)]
  const unique = [...new Set(values.map((value) => value.toFixed(4)))].map(Number)
  const shown: { value: number; percent: number }[] = []
  for (const value of unique) {
    const percent = markerPercent(value, track)
    const x = (percent / 100) * width
    const previous = shown.at(-1)
    const previousX = previous ? (previous.percent / 100) * width : null
    const last = value === unique[unique.length - 1]
    if (previous && previousX !== null && Math.abs(x - previousX) < 36) {
      if (last) shown.pop()
      else continue
    }
    shown.push({ value, percent })
  }
  return shown
}
