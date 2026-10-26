/** Export colors from the report spec. Kept apart from the app tokens so print and screen stay exact. */
export const BAND_SCREEN = {
  pass: '#7C8BFF',
  'second-lower': '#38B6C9',
  'second-upper': '#E6B84A',
  first: '#F07A5A',
  plain: '#D5D8E2',
} as const

export const BAND_PRINT = {
  pass: '#B9C0FF',
  'second-lower': '#9BD8E2',
  'second-upper': '#F0D488',
  first: '#F7C4B5',
  plain: '#E4E4E7',
} as const

export const PAPER = '#FDFCF9'
export const INK = '#14213D'
export const INK_MUTED = '#5A6483'
export const HAIRLINE = '#D5D8E2'
export const NIGHT = '#10132A'
export const AMBER = '#E6B84A'

export const PAPER_PX = {
  A4: { width: 794, height: 1123 },
  LETTER: { width: 816, height: 1056 },
} as const

export const SOCIAL_PX = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
} as const
