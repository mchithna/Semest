import { DEFAULT_CLASS_CUTS, parseClassCuts, type ClassCut } from './bands'
import { formatGpa } from './score'

export const BAND_LIMIT = 8
export const BAND_FLOOR_COUNT = 2
export const BAND_NAME_LIMIT = 24

export type BandDraft = {
  key: string
  id: string
  label: string
  min: string
}

export function cutsToDraft(cuts: ClassCut[]): BandDraft[] {
  return cuts.map((cut) => ({
    key: cut.id,
    id: cut.id,
    label: cut.label,
    min: formatGpa(cut.min),
  }))
}

export function blankBandDraft(): BandDraft {
  const id = `band-${crypto.randomUUID()}`
  return { key: id, id, label: '', min: '' }
}

/** A start the student typed. Rejects blanks, words, and scientific notation. */
export function parseBandMin(value: string): number | null {
  const text = value.trim()
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

export function scaleTopOf(grades: { points: number }[]): number | null {
  const points = grades.map((row) => Number(row.points)).filter((value) => Number.isFinite(value))
  if (points.length === 0) return null
  const top = Math.max(...points)
  return top > 0 ? top : null
}

function cutSignature(cuts: ClassCut[]): string {
  return [...cuts]
    .sort((a, b) => a.min - b.min || a.label.localeCompare(b.label))
    .map((cut) => `${cut.label.trim()}\0${formatGpa(cut.min)}`)
    .join('\n')
}

export function isCustomClassCuts(value: unknown): boolean {
  const cuts = parseClassCuts(value)
  if (cuts.length === 0) return false
  return cutSignature(cuts) !== cutSignature(DEFAULT_CLASS_CUTS)
}

export function draftMatchesCuts(rows: BandDraft[], cuts: ClassCut[]): boolean {
  if (rows.length !== cuts.length) return false
  const parsed: ClassCut[] = []
  for (const row of rows) {
    const min = parseBandMin(row.min)
    if (min == null) return false
    parsed.push({ id: row.id, label: row.label.trim(), min })
  }
  return cutSignature(parsed) === cutSignature(cuts)
}

export type BandRowIssue = {
  key: string
  field: 'label' | 'min'
  message: string
}

export function bandDraftIssues(rows: BandDraft[], scaleTop: number): BandRowIssue[] {
  const seen = new Set<string>()
  const issues: BandRowIssue[] = []
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    const issue = rowIssue(rows, index, scaleTop, seen)
    if (issue) issues.push({ key: row.key, ...issue })
  }
  return issues
}

function rowIssue(
  rows: BandDraft[],
  index: number,
  scaleTop: number,
  seen: Set<string>,
): { field: 'label' | 'min'; message: string } | null {
  const row = rows[index]
  const label = row.label.trim()
  if (!label) return { field: 'label', message: 'Enter a name.' }
  if (label.length > BAND_NAME_LIMIT) return { field: 'label', message: `Use ${BAND_NAME_LIMIT} characters or fewer.` }
  const nameKey = label.toLocaleLowerCase()
  if (seen.has(nameKey)) return { field: 'label', message: 'Another band already uses this name.' }
  seen.add(nameKey)

  const minText = row.min.trim()
  if (!minText || parseBandMin(minText) == null) {
    if (/^-\d+(\.\d+)?$/.test(minText)) return { field: 'min', message: 'Start at 0 or higher.' }
    return { field: 'min', message: 'Enter where this band starts.' }
  }
  const min = parseBandMin(minText)!
  if (min >= scaleTop) return { field: 'min', message: `Start below ${formatGpa(scaleTop)}. That is the top of this scale.` }

  const earlier = rows.slice(0, index).find((item) => parseBandMin(item.min) === min)
  if (earlier) {
    const name = earlier.label.trim() || 'the band above'
    return { field: 'min', message: `Must start higher than ${name} (${formatGpa(min)}).` }
  }
  return null
}

/** Rows with a start move into order. A half-typed start stays at the bottom. */
export function sortBandDraft(rows: BandDraft[]): BandDraft[] {
  const placed: BandDraft[] = []
  const pending: BandDraft[] = []
  for (const row of rows) {
    const min = parseBandMin(row.min)
    if (min == null || min < 0) pending.push(row)
    else placed.push(row)
  }
  placed.sort((a, b) => parseBandMin(a.min)! - parseBandMin(b.min)! || a.key.localeCompare(b.key))
  return [...placed, ...pending]
}

/** Cuts ready to save. Null while a row is invalid or the count is outside 2–8. */
export function draftCuts(rows: BandDraft[], scaleTop: number): ClassCut[] | null {
  if (rows.length < BAND_FLOOR_COUNT || rows.length > BAND_LIMIT) return null
  if (!Number.isFinite(scaleTop) || scaleTop <= 0) return null
  if (bandDraftIssues(rows, scaleTop).length > 0) return null
  return rows
    .map((row) => ({
      id: row.id,
      label: row.label.trim(),
      min: parseBandMin(row.min)!,
    }))
    .sort((a, b) => a.min - b.min || a.id.localeCompare(b.id))
}

/** Where this row ends: the next higher start, or the scale maximum. */
export function runsToValue(rows: BandDraft[], index: number, scaleTop: number): number | null {
  const min = parseBandMin(rows[index]?.min ?? '')
  if (min == null || min < 0 || min >= scaleTop) return null
  const higher = rows
    .map((row) => parseBandMin(row.min))
    .filter((value): value is number => value != null && value > min && value < scaleTop)
  if (higher.length === 0) return scaleTop
  return Math.min(...higher)
}

export function previewCuts(rows: BandDraft[], scaleTop: number): ClassCut[] {
  return rows.flatMap((row) => {
    const min = parseBandMin(row.min)
    if (min == null || min < 0 || min >= scaleTop) return []
    return [{ id: row.id, label: row.label.trim(), min }]
  })
}

export function lowestStart(rows: BandDraft[]): number | null {
  const values = rows
    .map((row) => parseBandMin(row.min))
    .filter((value): value is number => value != null && value >= 0)
  if (values.length === 0) return null
  return Math.min(...values)
}
