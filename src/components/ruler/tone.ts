import type { BandTone } from '@/lib/bands'

export const BAND_TONE_CLASS: Record<BandTone, string> = {
  pass: 'bg-band-pass',
  'second-lower': 'bg-band-second-lower',
  'second-upper': 'bg-band-second-upper',
  first: 'bg-band-first',
  plain: 'bg-foreground/25',
}
