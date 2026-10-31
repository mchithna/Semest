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
export const INK = '#10132A'
export const INK_MUTED = '#5A6483'
export const HAIRLINE = '#E3E5F0'
export const NIGHT = '#10132A'
export const NIGHT_RAISED = '#1A1F42'
export const NIGHT_MUTED = '#A3AAD1'
export const NIGHT_TEXT = '#F4F6FF'
export const AMBER = '#E6B84A'

/** Spacing scale in pt for PDFs and px at 1080 for the PNG. No other values. */
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, huge: 48 } as const

export const PAPER_PX = {
  A4: { width: 794, height: 1123 },
  LETTER: { width: 816, height: 1056 },
} as const

/** Page size in pt, which is what react-pdf uses. The HTML previews use pt units too. */
export const PAPER_PT = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
} as const

export const SOCIAL_PX = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
} as const

/** Blend a hex colour toward another. `amount` 0 returns `from`, 1 returns `to`. */
export function mix(from: string, to: string, amount: number): string {
  const a = parseHex(from)
  const b = parseHex(to)
  const channel = (index: number) => Math.round(a[index] + (b[index] - a[index]) * amount)
  return `#${[0, 1, 2].map((index) => channel(index).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function parseHex(hex: string): [number, number, number] {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16)) as [number, number, number]
}
