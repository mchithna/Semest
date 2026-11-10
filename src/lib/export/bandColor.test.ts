import { describe, expect, it } from 'vitest'
import { expandClassCuts, DEFAULT_CLASS_CUTS } from '@/lib/bands'
import { APP_BAND_STOPS } from '@/components/ruler/tone'
import { BAND_PRINT, BAND_SCREEN, mix, sampleStops } from './palette'
import { bandPaint } from './rulerStyle'

const screen = [BAND_SCREEN.pass, BAND_SCREEN['second-lower'], BAND_SCREEN['second-upper'], BAND_SCREEN.first]
const print = [BAND_PRINT.pass, BAND_PRINT['second-lower'], BAND_PRINT['second-upper'], BAND_PRINT.first]

describe('band colours by position', () => {
  it('keeps the four named colours when there are four bands', () => {
    expect(APP_BAND_STOPS.map((_, index) => sampleStops(APP_BAND_STOPS, index, 4))).toEqual([...APP_BAND_STOPS])
    expect(screen.map((_, index) => sampleStops(screen, index, 4))).toEqual(screen.map((color) => color.toUpperCase()))
    expect(print.map((_, index) => sampleStops(print, index, 4))).toEqual(print.map((color) => color.toUpperCase()))
  })

  it('uses the two ends for two bands and an even step for five', () => {
    expect(sampleStops(screen, 0, 2)).toBe(BAND_SCREEN.pass.toUpperCase())
    expect(sampleStops(screen, 1, 2)).toBe(BAND_SCREEN.first.toUpperCase())
    const middle = sampleStops(screen, 2, 5)
    expect(middle).toBe(mix(BAND_SCREEN['second-lower'], BAND_SCREEN['second-upper'], 0.5))
    expect(screen.map((color) => color.toUpperCase())).not.toContain(middle)
  })

  it('paints the share card and the PDF from the same position', () => {
    const bands = expandClassCuts(DEFAULT_CLASS_CUTS)
    expect(bandPaint(bands[0], true, 'night', 0, 4).fill).toBe(BAND_SCREEN.pass.toUpperCase())
    expect(bandPaint(bands[3], true, 'paper', 3, 4).fill).toBe(BAND_PRINT.first.toUpperCase())
    expect(bandPaint(bands[1], true, 'paper', 1, 2).fill).toBe(BAND_PRINT.first.toUpperCase())
  })
})
