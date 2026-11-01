/** Class cuts come from `classification_schemes`. This module only turns those rows into a ruler track. */
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

const BAND_TONES = new Set<BandTone>(['pass', 'second-lower', 'second-upper', 'first', 'plain'])

const CLASS_PHRASE: Record<Exclude<BandTone, 'plain'>, string> = {
  pass: 'Pass',
  'second-lower': 'Second class lower',
  'second-upper': 'Second class upper',
  first: 'First class',
}

type ScalePoints = { points: number }

type ScaleWithClasses = {
  classification_scheme?: { bands?: unknown } | null
  classification_bands?: unknown
}

/** Bands saved on a grade scale, either as a joined scheme or a preset snapshot. */
export function classBandsOf(scale?: ScaleWithClasses | null): Band[] {
  if (!scale) return []
  const fromScheme = parseClassBands(scale.classification_scheme?.bands)
  if (fromScheme.length > 0) return fromScheme
  return parseClassBands(scale.classification_bands)
}

/** Keeps only rows that match the band shape stored in `classification_schemes.bands`. */
export function parseClassBands(value: unknown): Band[] {
  if (!Array.isArray(value)) return []
  const bands: Band[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object') continue
    const item = row as Record<string, unknown>
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    const label = typeof item.label === 'string' ? item.label : ''
    const tone = item.tone
    const min = Number(item.min)
    const max = Number(item.max)
    if (!id || typeof tone !== 'string' || !BAND_TONES.has(tone as BandTone)) continue
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) continue
    bands.push({ id, label, min, max, tone: tone as BandTone })
  }
  return bands.sort((a, b) => a.min - b.min || a.max - b.max)
}

export function bandsForScale(scale: ScalePoints[] = [], classBands?: Band[] | null): BandTrack {
  const points = scale
    .map((row) => Number(row.points))
    .filter((value) => Number.isFinite(value))
  const scaleMax = points.length > 0 ? Math.max(...points) : 0
  const bands = parseClassBands(classBands)

  if (bands.length === 0) return plainTrack(scaleMax)

  const topBand = bands[bands.length - 1]
  const top = scaleMax > topBand.max ? scaleMax : topBand.max
  const stretched = bands.map((band, index) =>
    index === bands.length - 1 ? { ...band, max: top } : { ...band },
  )
  return { min: stretched[0].min, max: top, bands: stretched }
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
  /** Shown apart from the name, so a title ending in a digit does not run into the GPA. */
  scoreLabel?: string
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
      const width = estimateLabelWidth(markerCaption(marker)) + (marker.scoreLabel ? 14 : 0)
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

function plainTrack(scaleMax: number): BandTrack {
  const max = scaleMax > 0 ? scaleMax : 1
  return {
    min: 0,
    max,
    bands: [{ id: 'scale', label: '', min: 0, max, tone: 'plain' }],
  }
}

function formatGap(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2)
}

export function markerCaption(marker: RulerMarker): string {
  return marker.scoreLabel ? `${marker.label} · ${marker.scoreLabel}` : marker.label
}
