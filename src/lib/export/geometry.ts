import type { Band, BandTrack } from '@/lib/bands'

/**
 * The one ruler geometry. Every ruler (Ruler PDF, semester mini rulers, Social card, previews)
 * reads positions from here so bands, ticks, markers and dots always agree.
 * min and max come from the degree's track, never a hardcoded 4.0.
 */
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value))

export type RulerBand = Band & {
  /** 0..1 along the bar */
  start: number
  end: number
  /** percent values, ready for CSS or react-pdf */
  left: number
  width: number
}

export type RulerTick = { value: number; left: number; align: 'start' | 'center' | 'end' }

export type RulerGeometry = {
  min: number
  max: number
  /** gpa to 0..1 along the bar */
  pos: (gpa: number) => number
  /** gpa to percent, 0..100 */
  pct: (gpa: number) => number
  bands: RulerBand[]
  ticks: RulerTick[]
  /** false when there is no usable class scale */
  usable: boolean
}

export function rulerGeometry(track: BandTrack, minTickGapPct = 6): RulerGeometry {
  const { min, max } = track
  const span = max - min
  const usable = span > 0 && track.bands.some((band) => band.tone !== 'plain')
  const pos = (gpa: number) => (span > 0 && Number.isFinite(gpa) ? clamp((gpa - min) / span, 0, 1) : 0)
  const bands = track.bands.map((band): RulerBand => {
    const start = pos(band.min)
    const end = pos(band.max)
    return { ...band, start, end, left: start * 100, width: (end - start) * 100 }
  })

  const values = [min, ...track.bands.map((band) => band.min), ...track.bands.map((band) => band.max), max]
  const unique = [...new Set(values.map((value) => Math.round(value * 1000) / 1000))].sort((a, b) => a - b)
  const kept: number[] = []
  for (const value of unique) {
    const isLast = value === unique[unique.length - 1]
    const previous = kept[kept.length - 1]
    if (previous != null && (pos(value) - pos(previous)) * 100 < minTickGapPct) {
      // The two ends always win over an interior tick.
      if (isLast && kept.length > 1) kept[kept.length - 1] = value
      else if (isLast) kept.push(value)
      continue
    }
    kept.push(value)
  }
  const ticks = kept.map((value, index): RulerTick => ({
    value,
    left: pos(value) * 100,
    align: index === 0 ? 'start' : index === kept.length - 1 ? 'end' : 'center',
  }))

  return { min, max, pos, pct: (gpa) => pos(gpa) * 100, bands, ticks, usable }
}

/** Centre of a pill, in percent, held so a pill of `pillWidth` stays inside a track `trackWidth` wide. */
export function clampPill(centerPct: number, pillWidth: number, trackWidth: number): number {
  if (trackWidth <= 0) return centerPct
  const half = (pillWidth / 2 / trackWidth) * 100
  return half >= 50 ? 50 : clamp(centerPct, half, 100 - half)
}

const CHAR_EM = 0.56
export function textWidth(text: string, fontSize: number, em = CHAR_EM) {
  return text.length * fontSize * em
}

/** Pill width from its text, in the same unit as the font size. */
export function pillWidth(text: string, fontSize: number, padX: number) {
  return textWidth(text, fontSize, 0.6) + padX * 2
}

/**
 * Picks a font size so a band name fits in at most two lines without being cut.
 * Wraps on spaces only, so "Second lower" becomes "Second / lower".
 */
export function fitBandLabel(label: string, available: number, fontSize: number, minFontSize = fontSize * 0.7) {
  const words = label.split(/\s+/).filter(Boolean)
  let size = fontSize
  while (size >= minFontSize) {
    const longest = Math.max(0, ...words.map((word) => textWidth(word, size)))
    const oneLine = textWidth(label, size) <= available
    const lines = oneLine ? 1 : twoLineFit(words, available, size) ? 2 : 3
    if (longest <= available && lines <= 2) return { fontSize: size, lines }
    size -= fontSize * 0.04
  }
  return { fontSize: minFontSize, lines: 2 }
}

function twoLineFit(words: string[], available: number, size: number) {
  let line = 1
  let used = 0
  for (const word of words) {
    const width = textWidth(word, size)
    const next = used === 0 ? width : used + textWidth(' ', size) + width
    if (next > available && used > 0) {
      line += 1
      used = width
    } else {
      used = next
    }
  }
  return line <= 2
}

/** Marks a band as reached by a GPA. The band holding the GPA counts as reached. */
export function bandReached(band: Band, value: number | null) {
  return value == null || value + 0.0001 >= band.min
}
