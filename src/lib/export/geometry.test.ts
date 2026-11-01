import { describe, expect, it } from 'vitest'
import { SRI_LANKAN_HONORS_BANDS } from '@/lib/classBands.fixture'
import { bandsForScale } from '@/lib/bands'
import { clampPill, fitBandLabel, pillWidth, rulerGeometry } from './geometry'

const scale420 = [{ points: 4.2 }, { points: 4 }, { points: 3.7 }, { points: 0 }]
const scale400 = [{ points: 4 }, { points: 3.7 }, { points: 0 }]

describe('ruler geometry', () => {
  it('uses the degree scale maximum, not a hardcoded 4.0', () => {
    const wide = rulerGeometry(bandsForScale(scale420, SRI_LANKAN_HONORS_BANDS))
    const narrow = rulerGeometry(bandsForScale(scale400, SRI_LANKAN_HONORS_BANDS))
    expect(wide.max).toBe(4.2)
    expect(narrow.max).toBe(4)
    expect(wide.pos(3.3)).toBeCloseTo((3.3 - 2) / 2.2, 6)
    expect(narrow.pos(3.3)).toBeCloseTo((3.3 - 2) / 2, 6)
  })

  it('clamps positions to the bar', () => {
    const geo = rulerGeometry(bandsForScale(scale420, SRI_LANKAN_HONORS_BANDS))
    expect(geo.pos(0)).toBe(0)
    expect(geo.pos(9)).toBe(1)
    expect(geo.pct(2)).toBe(0)
  })

  it('builds band widths from pos(end) - pos(start) so they tile the bar', () => {
    for (const scale of [scale420, scale400]) {
      const geo = rulerGeometry(bandsForScale(scale, SRI_LANKAN_HONORS_BANDS))
      expect(geo.bands.reduce((sum, band) => sum + band.width, 0)).toBeCloseTo(100, 6)
      geo.bands.forEach((band, index) => {
        expect(band.width).toBeCloseTo((geo.pos(band.max) - geo.pos(band.min)) * 100, 9)
        if (index > 0) expect(band.left).toBeCloseTo(geo.bands[index - 1].left + geo.bands[index - 1].width, 9)
      })
    }
  })

  it('puts every tick on a band boundary, never evenly spaced', () => {
    const geo = rulerGeometry(bandsForScale(scale420, SRI_LANKAN_HONORS_BANDS))
    expect(geo.ticks.map((tick) => tick.value)).toEqual([2, 3, 3.3, 3.7, 4.2])
    const edges = [...geo.bands.map((band) => band.left), 100]
    for (const tick of geo.ticks) expect(edges.some((edge) => Math.abs(edge - tick.left) < 1e-9)).toBe(true)
    expect(geo.ticks[0].align).toBe('start')
    expect(geo.ticks[geo.ticks.length - 1].align).toBe('end')
  })

  it('works for different thresholds and reports unusable tracks', () => {
    const custom = rulerGeometry({
      min: 0,
      max: 100,
      bands: [
        { id: 'a', label: 'Pass', min: 0, max: 40, tone: 'pass' },
        { id: 'b', label: 'Merit', min: 40, max: 70, tone: 'second-upper' },
        { id: 'c', label: 'Distinction', min: 70, max: 100, tone: 'first' },
      ],
    })
    custom.bands.map((band) => band.width).forEach((width, index) => expect(width).toBeCloseTo([40, 30, 30][index], 9))
    expect(custom.usable).toBe(true)
    const none = rulerGeometry(bandsForScale([{ points: 100 }]))
    expect(none.usable).toBe(false)
  })

  it('keeps a You pill inside the margins while the stem stays at the true position', () => {
    expect(clampPill(0, 60, 400)).toBeCloseTo(7.5, 6)
    expect(clampPill(100, 60, 400)).toBeCloseTo(92.5, 6)
    expect(clampPill(50, 60, 400)).toBe(50)
    expect(pillWidth('You 3.32', 9, 8)).toBeGreaterThan(40)
  })

  it('shrinks a band name before it would be cut, and wraps on spaces only', () => {
    expect(fitBandLabel('Second lower', 60, 9.5).lines).toBeLessThanOrEqual(2)
    const fit = fitBandLabel('Second lower', 40, 28)
    expect(fit.fontSize).toBeLessThan(28)
  })
})
