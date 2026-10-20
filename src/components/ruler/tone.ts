import type { BandTone } from '@/lib/bands'

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
