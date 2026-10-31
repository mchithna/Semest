import { formatGpa } from '@/lib/score'
import { formatCredits, type ReportModel } from './reportModel'

/** Text the HTML preview and the PDF both print, so the two renderers cannot drift. */

export function rulerSummary(model: ReportModel): { label: string; value: string }[] {
  return [
    { label: 'Credits earned', value: formatCredits(model.earnedCredits) },
    { label: 'Best semester', value: model.bestSemesterGpa != null ? formatGpa(model.bestSemesterGpa) : '—' },
    { label: 'Semesters graded', value: String(model.gradedSemesterCount) },
  ]
}

export function heroStatement(model: ReportModel) {
  return model.standing || 'No classification yet'
}

export function heroDetail(model: ReportModel) {
  return [model.nextBand, `${formatCredits(model.earnedCredits)} of ${formatCredits(model.totalCredits)} credits graded.`]
    .filter(Boolean)
    .join(' ')
}

export function heroGpa(model: ReportModel) {
  return model.cgpa != null ? formatGpa(model.cgpa) : '—'
}

export const NO_BANDS_NOTE = 'This grade scale has no classification bands, so the ruler is left out.'

export function pageLabel(index: number, count: number) {
  return `Page ${index + 1} of ${count}`
}

/** Largest font size, up to `max`, at which `text` stays on one line in `width`. */
export function singleLineSize(text: string, width: number, max: number, min = 10, em = 0.52) {
  const fit = Math.floor((width / Math.max(text.length, 1) / em) * 10) / 10
  return Math.max(min, Math.min(max, fit))
}
