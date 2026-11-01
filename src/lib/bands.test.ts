import { describe, expect, it } from 'vitest'
import schemaSql from '../../supabase/schema.sql?raw'
import { SRI_LANKAN_HONORS_BANDS } from './classBands.fixture'
import {
  bandsForScale,
  parseClassBands,
  markerPercent,
  nextBandSentence,
  placeMarkers,
  standingSentence,
  type RulerMarker,
} from './bands'

const honors = [
  { points: 4 },
  { points: 3.7 },
  { points: 3 },
  { points: 2 },
  { points: 0 },
]

function honorsTrack(scale: { points: number }[] = honors) {
  return bandsForScale(scale, SRI_LANKAN_HONORS_BANDS)
}

describe('bands', () => {
  it('reads the seeded scheme instead of inventing cuts from the point values', () => {
    const match = schemaSql.match(/'Sri Lankan honors',\s*true,\s*4\.5,\s*'(\[[\s\S]*?\])'::jsonb/)
    expect(match).not.toBeNull()
    expect(parseClassBands(JSON.parse(match?.[1] ?? '[]'))).toEqual(SRI_LANKAN_HONORS_BANDS)

    const track = honorsTrack()
    expect(track.min).toBe(2)
    expect(track.max).toBe(4)
    expect(track.bands.map((band) => band.min)).toEqual([2, 3, 3.3, 3.7])
  })

  it('leaves a scale unclassified when no scheme is attached', () => {
    expect(bandsForScale(honors)).toEqual({
      min: 0,
      max: 4,
      bands: [{ id: 'scale', label: '', min: 0, max: 4, tone: 'plain' }],
    })
  })

  it('extends the top when an honors scale passes 4.00', () => {
    const track = honorsTrack([{ points: 4.2 }, { points: 0 }])
    expect(track.max).toBe(4.2)
    expect(track.bands.at(-1)?.max).toBe(4.2)
    expect(track.bands.at(-1)?.min).toBe(3.7)
  })

  it('uses one plain track when the scale is wider than honors', () => {
    const track = bandsForScale([{ points: 10 }, { points: 0 }])
    expect(track).toEqual({
      min: 0,
      max: 10,
      bands: [{ id: 'scale', label: '', min: 0, max: 10, tone: 'plain' }],
    })
  })

  it('keeps supplied bands when a caller passes them', () => {
    const supplied = [
      { id: 'low', label: 'Low', min: 0, max: 5, tone: 'plain' as const },
      { id: 'high', label: 'High', min: 5, max: 10, tone: 'plain' as const },
    ]
    const track = bandsForScale(honors, supplied)
    expect(track.min).toBe(0)
    expect(track.max).toBe(10)
    expect(track.bands).toHaveLength(2)
    expect(supplied[1].max).toBe(10)
  })

  it('places 3.32 two thirds of the way from 2.00 to 4.00', () => {
    const track = honorsTrack()
    expect(markerPercent(3.32, track)).toBeCloseTo(66)
    expect(markerPercent(1, track)).toBe(0)
    expect(markerPercent(5, track)).toBe(100)
  })

  it('writes the standing sentence from the band floor', () => {
    const track = honorsTrack()
    expect(standingSentence(3.32, true, track)).toBe('Second class upper, by 0.02.')
    expect(nextBandSentence(3.32, track)).toBe('0.38 more reaches First class.')
    expect(standingSentence(3.32, false, track)).toBeNull()
    expect(nextBandSentence(3.8, track)).toBeNull()
  })

  it('stacks close semester pins on opposite sides', () => {
    const track = honorsTrack()
    const markers: RulerMarker[] = [
      { id: 'a', value: 3.38, label: 'Year 1, Sem 1 3.38', kind: 'pin' },
      { id: 'b', value: 3.54, label: 'Year 1, Sem 2 3.54', kind: 'pin' },
    ]
    const placed = placeMarkers(markers, track, 800)
    expect(placed.get('a')).toBe('above')
    expect(placed.get('b')).toBe('below')
  })

  it('uses the opposite side before collapsing labels', () => {
    const track = honorsTrack()
    const markers: RulerMarker[] = [
      { id: 'you', value: 3.32, label: 'You 3.32', kind: 'you' },
      { id: 'target', value: 3.7, label: 'Target 3.70', kind: 'target' },
    ]
    const placed = placeMarkers(markers, track, 220)
    expect(placed.get('you')).toBe('above')
    expect(placed.get('target')).toBe('below')
  })

  it('collapses labels into a legend when both sides are crowded', () => {
    const track = honorsTrack()
    const markers: RulerMarker[] = [
      { id: 'you', value: 3.3, label: 'You 3.30', kind: 'you' },
      { id: 'pin', value: 3.45, label: 'Year 1, Sem 1 3.45', kind: 'pin' },
      { id: 'target', value: 3.6, label: 'Target 3.60', kind: 'target' },
    ]
    const placed = placeMarkers(markers, track, 260)
    expect(placed.get('you')).toBe('legend')
    expect(placed.get('pin')).toBe('legend')
    expect(placed.get('target')).toBe('legend')
  })
})
