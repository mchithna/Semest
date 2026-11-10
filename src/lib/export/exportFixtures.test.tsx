import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { SocialCard } from '@/components/export/SocialCard'
import { buildReport, type PaperSize, type SocialAspect } from './reportModel'
import { FIXTURE_BY_ID, type QaFixture } from './fixtures'
import { socialChipSlice, socialPlan, SOCIAL } from './layout'
import { resolveToggles, type ThemeId } from './themes'

function report(fixture: QaFixture, theme: ThemeId, extra: { paper?: PaperSize; aspect?: SocialAspect } = {}) {
  const resolved = resolveToggles(theme, fixture.toggles, true)
  return buildReport({
    degree: fixture.degree,
    semesters: fixture.semesters,
    theme,
    toggles: resolved.values,
    title: '',
    studentName: fixture.studentName,
    studentId: fixture.studentId,
    paper: extra.paper ?? 'A4',
    aspect: extra.aspect ?? '4:5',
    targetCgpa: fixture.target ?? null,
    issuedOn: new Date('2026-10-27T10:00:00Z'),
  })
}

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('export fixtures', () => {
  it('two graded semesters give 3.10, 3.54 and a 3.32 cumulative from one formula', () => {
    const model = report(FIXTURE_BY_ID.two, 'ruler')
    expect(model.semesters.map((semester) => semester.gpa)).toEqual([3.1, 3.54])
    expect(model.cgpa).toBe(3.32)
    expect(model.track.max).toBe(4.2)
    expect(model.standing).toBe('Second upper, by 0.02.')
    expect(model.distanceToNext).toBe('0.38')
  })

  it('eight semesters paginate without splitting a semester, and the ruler page count matches the key reserve', () => {
    for (const paper of ['A4', 'LETTER'] as const) {
      const model = report(FIXTURE_BY_ID.eight, 'ruler', { paper })
      const seen = model.pages.flatMap((page) => page.semesterIds)
      expect(seen).toHaveLength(8)
      expect(new Set(seen).size).toBe(8)
      expect(model.pages.length).toBeGreaterThan(1)
      expect(model.pages.slice(1).every((page) => !page.showIntro)).toBe(true)
    }
  })

  it('a degree with no classification bands turns the ruler off but still builds', () => {
    const model = report(FIXTURE_BY_ID.nobands, 'ruler')
    expect(model.hasClassBands).toBe(false)
    expect(model.show.classificationRuler).toBe(false)
    expect(model.cgpa).not.toBeNull()
  })

  it('renders a scale maximum of 4.00 and of 4.20 from their own tracks', () => {
    expect(report(FIXTURE_BY_ID.scale400, 'ruler').track.max).toBe(4)
    expect(report(FIXTURE_BY_ID.two, 'ruler').track.max).toBe(4.2)
  })

  it('social plan follows the spec sizes when they fit, and the story safe zone for 9:16', () => {
    const base = {
      chipCount: 2,
      hasMore: false,
      hideGpa: false,
      hasRuler: true,
      showTicks: true,
      hasTarget: false,
      hasStudent: false,
      hasMutedLine: true,
      hasHero: true,
    }
    const portrait = socialPlan({ ...base, aspect: '4:5' })
    expect(portrait.numeral).toBe(380)
    expect(portrait.chipGpa).toBe(84)
    expect(portrait.gap).toBeGreaterThan(0)
    const story = socialPlan({ ...base, aspect: '9:16' })
    expect(story.top).toBeGreaterThanOrEqual(250)
    expect(story.bottom).toBeGreaterThanOrEqual(340)
    expect(story.height - story.top - story.bottom).toBeGreaterThan(0)
  })

  it('never lets the blocks outgrow the card, for any aspect or chip count', () => {
    for (const aspect of ['1:1', '4:5', '9:16'] as const) {
      for (const chipCount of [1, 2, 3, 4]) {
        for (const hasMore of [false, true]) {
          for (const hideGpa of [false, true]) {
            const plan = socialPlan({
              aspect,
              chipCount,
              hasMore: hasMore && chipCount === 4,
              hideGpa,
              hasRuler: true,
              showTicks: !hideGpa,
              hasTarget: true,
              hasStudent: true,
              hasMutedLine: !hideGpa,
              hasHero: true,
            })
            expect(plan.gap, `${aspect} ${chipCount} chips, more ${hasMore}, hide ${hideGpa}`).toBeGreaterThanOrEqual(8)
          }
        }
      }
    }
  })

  it('shows the latest four chips and counts the rest', () => {
    expect(socialChipSlice([1, 2, 3, 4, 5, 6, 7, 8])).toEqual({ shown: [5, 6, 7, 8], more: 4 })
    expect(SOCIAL.maxChips).toBe(4)
  })

  it('Hide exact GPA leaves no GPA digits on the social card', () => {
    const model = report(FIXTURE_BY_ID.hidden, 'social')
    expect(model.hideExactGpa).toBe(true)
    const html = renderToStaticMarkup(<SocialCard model={model} />)
    const visible = text(html)
    expect(visible).not.toMatch(/\d\.\d\d/)
    expect(visible).toContain('Second upper')
    expect(visible).not.toContain('@')
  })

  it('shows exact numbers by default and never the student id unless asked', () => {
    const model = report(FIXTURE_BY_ID.two, 'social')
    const visible = text(renderToStaticMarkup(<SocialCard model={model} />))
    expect(visible).toContain('3.32')
    expect(visible).toContain('0.38 from First')
    expect(visible).not.toContain('First class')
    expect(visible).not.toContain('CS26-0142')
    expect(visible).not.toContain('Alex Morgan')
  })

  it('an empty student name still builds ruler and social documents', () => {
    expect(report(FIXTURE_BY_ID.noname, 'ruler').cgpa).toBe(3.32)
    expect(report(FIXTURE_BY_ID.noname, 'social').cgpa).toBe(3.32)
  })
})
