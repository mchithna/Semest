import type { Band } from '@/lib/bands'
import { AMBER, BAND_PRINT, BAND_SCREEN, INK, INK_MUTED, NIGHT, NIGHT_MUTED, NIGHT_TEXT, mix } from './palette'

export type RulerVariant = 'paper' | 'night'

export type BandPaint = {
  fill: string
  text: string
  /** dashed 1px edge for unreached bands on paper */
  edge: string | null
}

/** Colours for a band. Both the HTML and the PDF renderer read this, so reached and unreached look the same. */
export function bandPaint(band: Band, reached: boolean, variant: RulerVariant): BandPaint {
  if (variant === 'night') {
    const color = BAND_SCREEN[band.tone]
    return reached
      ? { fill: color, text: NIGHT, edge: null }
      : { fill: mix(NIGHT, color, 0.22), text: color, edge: null }
  }
  const tint = BAND_PRINT[band.tone]
  return reached
    ? { fill: tint, text: INK, edge: null }
    : { fill: mix(tint, '#FFFFFF', 0.55), text: INK_MUTED, edge: mix(tint, INK, 0.28) }
}

export const RULER_COLORS = {
  paper: { ink: INK, muted: INK_MUTED, pillBg: INK, pillText: '#FFFFFF', ring: '#FFFFFF', track: '#FFFFFF' },
  night: { ink: NIGHT_TEXT, muted: NIGHT_MUTED, pillBg: NIGHT_TEXT, pillText: NIGHT, ring: NIGHT, track: NIGHT },
} as const

export const TARGET_COLOR = AMBER

export type RulerMetrics = {
  unit: 'px' | 'pt'
  /** width of the ruler track in `unit` */
  width: number
  bar: number
  label: number
  tick: number
  pillFont: number
  pillHeight: number
  pillPadX: number
  stem: number
  stemWidth: number
  tickGap: number
  tickLine: number
  labelPad: number
  targetGap: number
  targetStem: number
}

/** Ruler PDF (pt) */
export function paperMetrics(width: number): RulerMetrics {
  return {
    unit: 'pt',
    width,
    bar: 34,
    label: 9.5,
    tick: 8,
    pillFont: 9,
    pillHeight: 18,
    pillPadX: 8,
    stem: 6,
    stemWidth: 1.5,
    tickGap: 6,
    tickLine: 10,
    labelPad: 6,
    targetGap: 8,
    targetStem: 6,
  }
}

/** Social card (px at 1080) */
export function nightMetrics(width: number): RulerMetrics {
  return {
    unit: 'px',
    width,
    bar: 76,
    label: 28,
    tick: 26,
    pillFont: 30,
    pillHeight: 52,
    pillPadX: 24,
    stem: 16,
    stemWidth: 2,
    tickGap: 12,
    tickLine: 32,
    labelPad: 16,
    targetGap: 16,
    targetStem: 16,
  }
}
