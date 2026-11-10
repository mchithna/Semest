/** Class cuts live on the degree. This module turns those rows into a ruler track. */
export type BandTone = 'pass' | 'second-lower' | 'second-upper' | 'first' | 'plain'

export type Band = {
  id: string
  label: string
  min: number
  max: number
  tone: BandTone
}

/** A saved cut: the name and where the band starts. The end is the next cut, or the scale maximum. */
export type ClassCut = {
  id: string
  label: string
  min: number
}

/** Copy placed on a new degree. Matches the seeded Sri Lankan honors scheme. */
export const DEFAULT_CLASS_CUTS: ClassCut[] = [
  { id: 'pass', label: 'Pass', min: 2 },
  { id: 'second-lower', label: 'Second lower', min: 3 },
  { id: 'second-upper', label: 'Second upper', min: 3.3 },
  { id: 'first', label: 'First', min: 3.7 },
]

const DEFAULT_CLASS_TOP = 4

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
  class_bands?: unknown
  grade_scale?: {
    classification_scheme?: { bands?: unknown } | null
    classification_bands?: unknown
  } | null
  classification_scheme?: { bands?: unknown } | null
  classification_bands?: unknown
}

const TONE_BY_ID: Record<string, Exclude<BandTone, 'plain'>> = {
  pass: 'pass',
  'second-lower': 'second-lower',
  'second-upper': 'second-upper',
  first: 'first',
}

/** Reads `{id, label, min}` rows. Older rows that also store `max` and `tone` still count. */
export function parseClassCuts(value: unknown): ClassCut[] {
  if (!Array.isArray(value)) return []
  const cuts: ClassCut[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object') continue
    const item = row as Record<string, unknown>
    const id = typeof item.id === 'string' ? item.id.trim() : ''
    const label = typeof item.label === 'string' ? item.label.trim() : ''
    const min = Number(item.min)
    if (!id || !label || !Number.isFinite(min)) continue
    cuts.push({ id, label, min })
  }
  return cuts.sort((a, b) => a.min - b.min || a.id.localeCompare(b.id))
}

/** Fills each cut up to the next one. The last cut runs to `top` until the scale stretches it. */
export function expandClassCuts(cuts: ClassCut[], top = DEFAULT_CLASS_TOP): Band[] {
  const sorted = [...cuts].sort((a, b) => a.min - b.min)
  return sorted.flatMap((cut, index) => {
    const next = sorted[index + 1]
    const max = next && next.min > cut.min ? next.min : Math.max(top, cut.min + 0.0001)
    if (max <= cut.min) return []
    return [{
      id: cut.id,
      label: cut.label,
      min: cut.min,
      max,
      tone: TONE_BY_ID[cut.id] ?? toneByPosition(index, sorted.length),
    }]
  })
}

function toneByPosition(index: number, count: number): Exclude<BandTone, 'plain'> {
  const order = ['pass', 'second-lower', 'second-upper', 'first'] as const
  if (count <= 1) return order[0]
  const slot = Math.round((index / (count - 1)) * (order.length - 1))
  return order[slot]
}

/** The degree copy wins. A scale scheme is only the fallback for a degree that has no copy yet. */
export function classBandsOf(source?: ScaleWithClasses | null): Band[] {
  if (!source) return []
  const own = parseClassCuts(source.class_bands)
  if (own.length > 0) return expandClassCuts(own)
  const scale = source.grade_scale ?? source
  const fromScheme = parseClassCuts(scale.classification_scheme?.bands)
  if (fromScheme.length > 0) return expandClassCuts(fromScheme)
  return expandClassCuts(parseClassCuts(scale.classification_bands))
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

/** "Second upper, by 0.02." Uses the saved band name. Null when the score is not in a class band. */
export function standingSentence(score: number, graded: boolean, track: BandTrack): string | null {
  if (!graded || !Number.isFinite(score)) return null
  const band = bandAt(score, track)
  if (!band || band.tone === 'plain') return null
  const into = Math.max(0, score - band.min)
  return `${bandPhrase(band)}, by ${formatGap(into)}.`
}

/** "0.38 more reaches First." Null when no higher band remains. */
export function nextBandSentence(score: number, track: BandTrack): string | null {
  if (!Number.isFinite(score)) return null
  const next = track.bands.find((band) => band.tone !== 'plain' && band.min > score + 0.0005)
  if (!next || next.tone === 'plain') return null
  return `${formatGap(next.min - score)} more reaches ${bandPhrase(next)}.`
}

function bandPhrase(band: Band): string {
  if (band.label.trim()) return band.label.trim()
  if (band.tone === 'plain') return ''
  return CLASS_PHRASE[band.tone]
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
