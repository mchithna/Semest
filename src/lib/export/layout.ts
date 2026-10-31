import { SPACE } from './palette'
import type { PaperSize, SocialAspect } from './reportModel'

/**
 * Layout numbers shared by the HTML preview, the PDF and the paginator.
 * PDF templates are in pt. HTML previews use the same numbers with `pt` units,
 * so a page looks the same in both renderers.
 */

export const PAGE_PT = {
  A4: { width: 595.28, height: 841.89 },
  LETTER: { width: 612, height: 792 },
} as const satisfies Record<PaperSize, { width: number; height: number }>

export const MARGIN = SPACE.huge
export const FOOTER_H = 20

export function contentWidth(paper: PaperSize) {
  return PAGE_PT[paper].width - MARGIN * 2
}

/** Lines of 8pt text a key column needs. Mirrors how both renderers wrap. */
export function keyLines(text: string, columnWidth: number, fontSize = 8) {
  const perLine = Math.max(8, Math.floor(columnWidth / (fontSize * 0.5)))
  return Math.max(1, Math.ceil(text.length / perLine))
}

export const KEY_LINE = 11
export const KEY_GAP = SPACE.lg

export function keyHeight(paper: PaperSize, gradeScale: string, classification: string) {
  const column = (contentWidth(paper) - SPACE.xl) / 2
  const lines = Math.max(keyLines(`Grade scale. ${gradeScale}`, column), keyLines(`Classification. ${classification}`, column))
  return lines * KEY_LINE + SPACE.sm
}

/** y limit for page content: above the key block and the footer. */
export function contentBottom(paper: PaperSize, keyH: number) {
  return PAGE_PT[paper].height - MARGIN - FOOTER_H - KEY_GAP - keyH - SPACE.xl
}

/* ---------- Ruler PDF ---------- */

export const RULER = {
  headerH: 24,
  stripH: 6,
  heroLabel: 12,
  heroNumeral: 124,
  heroNumeralLine: Math.round(124 * 0.85),
  heroH: 12 + Math.round(124 * 0.85) + SPACE.xs,
  summaryH: 1 + SPACE.md + 11 + 2 + 22,
  bar: 34,
  pill: 18,
  stem: 6,
  tickGap: 6,
  tickLine: 10,
  targetStem: 6,
  semesterPad: 14,
  trackH: 6,
  dot: 12,
  ring: 2,
} as const

export const RULER_STATEMENT_W = 190

/** Hero numeral size: 124pt, shrunk only when a wide value such as 100.00 would run into the statement block. */
export function heroNumeralSize(text: string, paper: PaperSize) {
  const available = contentWidth(paper) - RULER_STATEMENT_W - SPACE.lg
  const em = [...text].reduce((sum, ch) => sum + (/\d/.test(ch) ? 0.6 : 0.3), 0)
  return Math.min(RULER.heroNumeral, Math.floor(available / Math.max(em, 1)))
}

/** Width the right-hand header lines may use, so a long degree name never reaches the logo. */
export function headerRightWidth(paper: PaperSize) {
  return contentWidth(paper) - 100 - SPACE.lg
}

export function rulerBlockHeight(hasTarget: boolean) {
  const base = RULER.pill + RULER.stem + RULER.bar + RULER.tickGap + RULER.tickLine
  return base + (hasTarget ? SPACE.sm + RULER.targetStem + RULER.pill : 0)
}

export function rulerRowHeight(title: string, nameColumn: number) {
  const titleLines = Math.ceil((title.length * 11 * 0.55) / nameColumn) || 1
  const nameH = Math.min(titleLines, 2) * 14 + 12
  return RULER.semesterPad * 2 + Math.max(nameH, 24) + 1
}

/** Width of the name column in a ruler semester row: 1.2fr of 4.2fr after two 16pt gaps and the 64pt GPA. */
export function rulerNameColumn(paper: PaperSize) {
  const free = contentWidth(paper) - 64 - SPACE.lg * 2
  return (free * 1.2) / 4.2
}

/** Width of the mini ruler column in a semester row, pt. */
export function rulerMiniWidth(paper: PaperSize) {
  const free = contentWidth(paper) - 64 - SPACE.lg * 2
  return (free * 3) / 4.2
}

type RulerPlanInput = {
  paper: PaperSize
  summary: boolean
  ruler: boolean
  fallbackNote: boolean
  target: boolean
}

export function rulerIntroBottom(input: RulerPlanInput) {
  let y = MARGIN + RULER.headerH
  y += SPACE.xxl + RULER.heroH
  if (input.summary) y += SPACE.xxl + RULER.summaryH
  if (input.ruler) y += SPACE.xxl + rulerBlockHeight(input.target)
  else if (input.fallbackNote) y += SPACE.xxl + 28
  return y + SPACE.xxl
}

export function rulerRunningBottom() {
  return MARGIN + RULER.headerH + SPACE.xxl
}

/* ---------- Formal ---------- */

export const FORMAL = {
  masthead: 64,
  /** margin 16, rule 1, pad 12, label 10, gap 4, two value lines 26 */
  meta: 69,
  /** margin 16, rules 2, pad 16, label 10, gap 4, value 26 */
  stats: 74,
  running: 28,
  semesterGap: SPACE.lg,
  head: 22,
  columns: 17,
  row: 21,
  endorse: 120,
} as const
export function formalIntroBottom(show: { studentDetails: boolean; degreeInstitution: boolean; summaryFigures: boolean; registrarEndorsement: boolean }) {
  let y = MARGIN + FORMAL.masthead
  if (show.studentDetails || show.degreeInstitution) y += FORMAL.meta
  if (show.summaryFigures) y += FORMAL.stats
  if (show.registrarEndorsement) y += FORMAL.endorse + SPACE.lg
  return y + SPACE.sm
}

export function formalBlockHeight(moduleCount: number) {
  return FORMAL.semesterGap + FORMAL.head + FORMAL.columns + Math.max(moduleCount, 1) * FORMAL.row
}

/* ---------- Social card ---------- */

export type SocialPlan = {
  width: number
  height: number
  margin: number
  top: number
  bottom: number
  header: number
  numeral: number
  numeralLine: number
  chipGpa: number
  chipLabel: number
  chipPadY: number
  chipPadX: number
  chipCredits: boolean
  chipCols: number
  chipRows: number
  chipH: number
  chipGap: number
  moreH: number
  classSize: number
  classLine: number
  hiddenClassSize: number
  hiddenClassLine: number
  showMuted: boolean
  chipsH: number
  heroH: number
  rulerH: number
  gap: number
  tier: number
}

export const SOCIAL = {
  margin: 88,
  header: 64,
  label: 40,
  labelLine: 48,
  classSize: 60,
  classLine: 72,
  mutedSize: 36,
  mutedLine: 44,
  studentLine: 40,
  bar: 76,
  pill: 52,
  stem: 16,
  band: 28,
  tick: 26,
  tickLine: 32,
  chipGap: 24,
  chipCreditsSize: 26,
  chipCreditsLine: 32,
  moreH: 72,
  maxChips: 4,
  hiddenClassSize: 132,
  hiddenClassLine: 126,
  /** 9:16 story safe zone */
  safeTop: 250,
  safeBottom: 340,
} as const

const BASE_NUMERAL: Record<SocialAspect, number> = { '1:1': 300, '4:5': 380, '9:16': 420 }

/**
 * Densest tiers only apply when the spec sizes would not fit, for instance a square card
 * with four chips, a "+N more" row, a target marker and the student line together.
 * classScale and chipGap stay at the spec until that point.
 */
const TIERS = [
  { scale: 1, chipGpa: 84, chipPadY: 32, chipLabel: 30, credits: true, muted: true, moreH: 72, classScale: 1, chipGap: 24 },
  { scale: 0.82, chipGpa: 72, chipPadY: 24, chipLabel: 30, credits: true, muted: true, moreH: 72, classScale: 1, chipGap: 24 },
  { scale: 0.68, chipGpa: 56, chipPadY: 24, chipLabel: 28, credits: false, muted: true, moreH: 72, classScale: 1, chipGap: 24 },
  { scale: 0.56, chipGpa: 48, chipPadY: 24, chipLabel: 26, credits: false, muted: true, moreH: 64, classScale: 1, chipGap: 24 },
  { scale: 0.46, chipGpa: 40, chipPadY: 16, chipLabel: 26, credits: false, muted: false, moreH: 56, classScale: 1, chipGap: 24 },
  { scale: 0.36, chipGpa: 36, chipPadY: 16, chipLabel: 26, credits: false, muted: false, moreH: 56, classScale: 1, chipGap: 16 },
  { scale: 0.3, chipGpa: 32, chipPadY: 12, chipLabel: 26, credits: false, muted: false, moreH: 48, classScale: 0.6, chipGap: 16 },
] as const

export type SocialPlanInput = {
  aspect: SocialAspect
  chipCount: number
  hasMore: boolean
  hideGpa: boolean
  hasRuler: boolean
  showTicks: boolean
  hasTarget: boolean
  hasStudent: boolean
  hasMutedLine: boolean
  hasHero: boolean
}

export function socialChipSlice<T>(items: T[]) {
  const shown = items.slice(-SOCIAL.maxChips)
  return { shown, more: Math.max(0, items.length - shown.length) }
}

export function socialPlan(input: SocialPlanInput): SocialPlan {
  const size = { '1:1': 1080, '4:5': 1080, '9:16': 1080 }[input.aspect]
  const height = { '1:1': 1080, '4:5': 1350, '9:16': 1920 }[input.aspect]
  const tall = input.aspect === '9:16'
  const top = tall ? SOCIAL.safeTop : SOCIAL.margin
  const bottom = tall ? SOCIAL.safeBottom : SOCIAL.margin
  const available = height - top - bottom

  const rulerH = input.hasRuler
    ? SOCIAL.pill +
      SOCIAL.stem +
      SOCIAL.bar +
      (input.showTicks ? SPACE.md + SOCIAL.tickLine : 0) +
      (input.hasTarget ? SPACE.lg + SPACE.lg + SOCIAL.pill : 0)
    : 0
  const rows = input.chipCount <= 2 ? 1 : 2
  const cols = input.chipCount === 1 ? 1 : 2

  let plan: SocialPlan | null = null
  for (let tier = 0; tier < TIERS.length; tier += 1) {
    const spec = TIERS[tier]
    const numeral = Math.round(BASE_NUMERAL[input.aspect] * spec.scale)
    const numeralLine = Math.round(numeral * 0.85)
    const classSize = Math.max(36, Math.round(SOCIAL.classSize * spec.classScale))
    const classLine = Math.max(44, Math.round(SOCIAL.classLine * spec.classScale))
    const hiddenClassSize = Math.max(48, Math.round(SOCIAL.hiddenClassSize * spec.classScale))
    const hiddenClassLine = Math.max(56, Math.round(SOCIAL.hiddenClassLine * spec.classScale))
    const heroNumbers =
      SOCIAL.labelLine +
      SPACE.lg +
      numeralLine +
      SPACE.lg +
      classLine +
      (input.hasMutedLine && spec.muted ? SPACE.sm + SOCIAL.mutedLine : 0)
    const heroHidden = SOCIAL.labelLine + SPACE.lg + hiddenClassLine * 2
    const heroH =
      (input.hasHero ? (input.hideGpa ? heroHidden : heroNumbers) : 0) +
      (input.hasStudent ? SPACE.lg + SOCIAL.studentLine : 0)

    const gpaLine = input.hideGpa ? 48 : spec.chipGpa
    const chipH =
      spec.chipPadY * 2 +
      36 +
      (spec.credits ? SPACE.xs + SOCIAL.chipCreditsLine : 0) +
      SPACE.sm +
      gpaLine
    const chipsH =
      input.chipCount === 0
        ? 0
        : rows * chipH + (rows - 1) * spec.chipGap + (input.hasMore ? spec.chipGap + spec.moreH : 0)

    const blocks = [SOCIAL.header, heroH, rulerH, chipsH].filter((value) => value > 0)
    const free = available - blocks.reduce((sum, value) => sum + value, 0)
    const gap = blocks.length > 1 ? free / (blocks.length - 1) : 0
    plan = {
      width: size,
      height,
      margin: SOCIAL.margin,
      top,
      bottom,
      header: SOCIAL.header,
      numeral,
      numeralLine,
      chipGpa: spec.chipGpa,
      chipLabel: spec.chipLabel,
      chipPadY: spec.chipPadY,
      chipPadX: 36,
      chipCredits: spec.credits,
      chipCols: cols,
      chipRows: rows,
      chipH,
      chipGap: spec.chipGap,
      moreH: spec.moreH,
      classSize,
      classLine,
      hiddenClassSize,
      hiddenClassLine,
      showMuted: spec.muted,
      chipsH,
      heroH,
      rulerH,
      gap,
      tier,
    }
    if (gap >= SPACE.xl) break
  }
  return plan as SocialPlan
}
