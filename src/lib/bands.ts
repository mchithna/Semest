/** Sri Lankan 4.0 class cuts. Pages read this module instead of embedding 3.30 or 3.70. */
export const HONORS_MAX_POINTS = 4.5

export type BandTone = 'pass' | 'second-lower' | 'second-upper' | 'first' | 'plain'

export type Band = {
  id: string
  label: string
  min: number
  max: number
  tone: BandTone
}

export type BandTrack = {
  min: number
  max: number
  bands: Band[]
}

export const CLASS_BANDS: Band[] = [
  { id: 'pass', label: 'Pass', min: 2, max: 3, tone: 'pass' },
  { id: 'second-lower', label: 'Second lower', min: 3, max: 3.3, tone: 'second-lower' },
  { id: 'second-upper', label: 'Second upper', min: 3.3, max: 3.7, tone: 'second-upper' },
  { id: 'first', label: 'First', min: 3.7, max: 4, tone: 'first' },
]

export const CLASS_CUTOFFS = {
  pass: CLASS_BANDS[0].min,
  secondLower: CLASS_BANDS[1].min,
  secondUpper: CLASS_BANDS[2].min,
  first: CLASS_BANDS[3].min,
} as const

const CLASS_PHRASE: Record<Exclude<BandTone, 'plain'>, string> = {
  pass: 'Pass',
  'second-lower': 'Second class lower',
  'second-upper': 'Second class upper',
  first: 'First class',
}

type ScalePoints = { points: number }

export function bandsForScale(scale: ScalePoints[] = [], overrides?: Band[]): BandTrack {
  if (overrides && overrides.length > 0) {
    return trackFromBands(overrides)
  }

  const points = scale
    .map((row) => Number(row.points))
    .filter((value) => Number.isFinite(value))

  if (points.length > 0 && !honorsScale(points)) {
    const top = Math.max(...points)
    const max = top > 0 ? top : 1
    return {
      min: 0,
      max,
      bands: [{ id: 'scale', label: '', min: 0, max, tone: 'plain' }],
    }
  }

  const scaleMax = points.length > 0 ? Math.max(...points) : 4
  const top = scaleMax > CLASS_BANDS[CLASS_BANDS.length - 1].max ? scaleMax : CLASS_BANDS[CLASS_BANDS.length - 1].max
  const bands = CLASS_BANDS.map((band, index) =>
    index === CLASS_BANDS.length - 1 ? { ...band, max: top } : { ...band },
  )
  return { min: bands[0].min, max: top, bands }
}

export function markerPercent(value: number, track: BandTrack): number {
  const span = track.max - track.min
  if (!Number.isFinite(value) || span <= 0) return 0
  const clamped = Math.min(track.max, Math.max(track.min, value))
  return ((clamped - track.min) / span) * 100
}

export function bandAt(value: number, track: BandTrack): Band | null {
  if (!Number.isFinite(value)) return null
  for (let index = 0; index < track.bands.length; index += 1) {
    const band = track.bands[index]
    const last = index === track.bands.length - 1
    if (value >= band.min && (value < band.max || last)) return band
  }
  return null
}

/** "Second class upper, by 0.02." Null when the score is not in a class band. */
export function standingSentence(score: number, graded: boolean, track: BandTrack): string | null {
  if (!graded || !Number.isFinite(score)) return null
  const band = bandAt(score, track)
  if (!band || band.tone === 'plain') return null
  const into = Math.max(0, score - band.min)
  return `${CLASS_PHRASE[band.tone]}, by ${formatGap(into)}.`
}

/** "0.38 more reaches First class." Null when no higher band remains. */
export function nextBandSentence(score: number, track: BandTrack): string | null {
  if (!Number.isFinite(score)) return null
  const next = track.bands.find((band) => band.tone !== 'plain' && band.min > score + 0.0005)
  if (!next || next.tone === 'plain') return null
  return `${formatGap(next.min - score)} more reaches ${CLASS_PHRASE[next.tone]}.`
}

export type MarkerKind = 'you' | 'target' | 'pin' | 'dot'

export type RulerMarker = {
  id: string
  value: number
  label: string
  kind: MarkerKind
}

export type MarkerPlacement = 'above' | 'below' | 'legend'

const LABEL_CHAR_PX = 6.5
const LABEL_PAD_PX = 22
const MARKER_GAP_PX = 8

export function estimateLabelWidth(label: string): number {
  return label.length * LABEL_CHAR_PX + LABEL_PAD_PX
}

/** Puts labels above and below the bar. Overlaps collapse every label into the legend. */
export function placeMarkers(
  markers: RulerMarker[],
  track: BandTrack,
  trackWidth: number,
): Map<string, MarkerPlacement> {
  const placed = new Map<string, MarkerPlacement>()
  const labeled = markers.filter((marker) => marker.kind !== 'dot')
  const occupied: { side: 'above' | 'below'; left: number; right: number }[] = []

  const hits = (side: 'above' | 'below', left: number, right: number) =>
    occupied.some((box) => box.side === side && left < box.right + MARKER_GAP_PX && right > box.left - MARKER_GAP_PX)

  let crowded = trackWidth <= 0
  if (!crowded) {
    for (const marker of [...labeled].sort((a, b) => a.value - b.value)) {
      const center = (markerPercent(marker.value, track) / 100) * trackWidth
      const width = estimateLabelWidth(marker.label)
      const left = center - width / 2
      const right = center + width / 2
      const side = (['above', 'below'] as const).find((candidate) => !hits(candidate, left, right))
      if (!side) {
        crowded = true
        break
      }
      occupied.push({ side, left, right })
      placed.set(marker.id, side)
    }
  }

  if (crowded) {
    for (const marker of labeled) placed.set(marker.id, 'legend')
  }

  return placed
}

function honorsScale(points: number[]): boolean {
  const max = Math.max(...points)
  return Number.isFinite(max) && max <= HONORS_MAX_POINTS
}

function trackFromBands(bands: Band[]): BandTrack {
  return {
    min: Math.min(...bands.map((band) => band.min)),
    max: Math.max(...bands.map((band) => band.max)),
    bands,
  }
}

function formatGap(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2)
}
