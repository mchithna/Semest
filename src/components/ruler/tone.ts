import type { BandTone } from '@/lib/bands'
import { sampleStops } from '@/lib/export/palette'

/** Same blue, teal, gold, and coral as the ruler tokens, in order. */
export const APP_BAND_STOPS = ['#5B6CFF', '#38B6C9', '#E6B84A', '#F07A5A'] as const

/** Fill for the band at `index` of `count`. Four bands return the four stops unchanged. */
export function bandColor(index: number, count: number): string {
  return sampleStops(APP_BAND_STOPS, index, count)
}

export const BAND_TONE_CLASS: Record<BandTone, string> = {
  pass: 'bg-band-pass',
  'second-lower': 'bg-band-second-lower',
  'second-upper': 'bg-band-second-upper',
  first: 'bg-band-first',
  plain: 'bg-foreground/25',
}

export const BAND_TEXT_CLASS: Record<BandTone, string> = {
  pass: 'text-band-pass',
  'second-lower': 'text-band-second-lower',
  'second-upper': 'text-band-second-upper',
  first: 'text-band-first',
  plain: 'text-muted-foreground',
}

export const BAND_BORDER_CLASS: Record<BandTone, string> = {
  pass: 'border-band-pass/80',
  'second-lower': 'border-band-second-lower/80',
  'second-upper': 'border-band-second-upper/80',
  first: 'border-band-first/80',
  plain: 'border-border',
}

const CARD_ACCENT_TONES: Exclude<BandTone, 'plain'>[] = [
  'pass',
  'second-lower',
  'second-upper',
  'first',
]

/** Band color for a card edge. Index cycles so neighbors do not share a color. */
export function cardAccentClass(index: number): string {
  const tone = CARD_ACCENT_TONES[((index % CARD_ACCENT_TONES.length) + CARD_ACCENT_TONES.length) % CARD_ACCENT_TONES.length]
  return BAND_TONE_CLASS[tone]
}
