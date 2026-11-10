import { describe, expect, it } from 'vitest'
import { DEFAULT_CLASS_CUTS } from './bands'
import {
  bandDraftIssues,
  blankBandDraft,
  cutsToDraft,
  draftCuts,
  draftMatchesCuts,
  isCustomClassCuts,
  lowestStart,
  runsToValue,
  scaleTopOf,
  sortBandDraft,
} from './classBandEditor'

function row(id: string, label: string, min: string) {
  return { key: id, id, label, min }
}

const scaleTop = 4.2

describe('class band editor', () => {
  it('treats the Sri Lankan cuts as the default', () => {
    expect(isCustomClassCuts(DEFAULT_CLASS_CUTS)).toBe(false)
    expect(isCustomClassCuts([
      { id: 'merit', label: 'Pass with Merit', min: 2.7 },
      { id: 'first', label: 'First', min: 3.7 },
    ])).toBe(true)
    expect(isCustomClassCuts(null)).toBe(false)
  })

  it('reads the highest letter-grade points as the ceiling', () => {
    expect(scaleTopOf([{ points: 4 }, { points: 4.2 }])).toBe(4.2)
    expect(scaleTopOf([])).toBeNull()
  })

  it('lets a lower start move ahead of the bands already listed', () => {
    const rows = [
      row('pass', 'Pass', '2.00'),
      row('first', 'First', '3.70'),
      row('low', 'Low', '1.50'),
    ]
    expect(bandDraftIssues(rows, scaleTop)).toEqual([])
    expect(sortBandDraft(rows).map((item) => item.id)).toEqual(['low', 'pass', 'first'])
    expect(runsToValue(rows, 2, 4)).toBe(2)
    expect(runsToValue(rows, 1, 4)).toBe(4)
    expect(draftCuts(rows, 4)?.map((cut) => cut.label)).toEqual(['Low', 'Pass', 'First'])
  })

  it('rejects a start that matches another band', () => {
    const rows = [
      row('pass', 'Pass', '2.00'),
      row('merit', 'Pass with Merit', '2.70'),
      row('second', 'Second lower', '2.70'),
    ]
    expect(bandDraftIssues(rows, scaleTop)).toEqual([
      { key: 'second', field: 'min', message: 'Must start higher than Pass with Merit (2.70).' },
    ])
    expect(draftCuts(rows, scaleTop)).toBeNull()
  })

  it('keeps names unique, short, and below the scale maximum', () => {
    const rows = [
      row('a', 'First', '0'),
      row('b', 'first', '1'),
      row('c', 'A very long classification name', '2'),
      row('d', 'Top', '4.20'),
    ]
    const messages = bandDraftIssues(rows, scaleTop).map((issue) => issue.message)
    expect(messages).toContain('Another band already uses this name.')
    expect(messages).toContain('Use 24 characters or fewer.')
    expect(messages).toContain('Start below 4.20. That is the top of this scale.')
  })

  it('saves two to eight rising cuts and shows where each one runs', () => {
    const rows = [
      row('pass', 'Pass', '2'),
      row('first', 'First', '3.7'),
    ]
    expect(draftCuts(rows, 4)?.map((cut) => [cut.label, cut.min])).toEqual([
      ['Pass', 2],
      ['First', 3.7],
    ])
    expect(runsToValue(rows, 0, 4)).toBe(3.7)
    expect(runsToValue(rows, 1, 4)).toBe(4)
    expect(draftMatchesCuts(cutsToDraft(DEFAULT_CLASS_CUTS), DEFAULT_CLASS_CUTS)).toBe(true)
    expect(lowestStart(rows)).toBe(2)
  })

  it('refuses a single band', () => {
    expect(draftCuts([row('pass', 'Pass', '2.00')], 4)).toBeNull()
    expect(blankBandDraft().id).toMatch(/^band-/)
  })
})