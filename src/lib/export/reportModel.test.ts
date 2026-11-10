import { describe, expect, it } from 'vitest'
import { SRI_LANKAN_HONORS_BANDS } from '@/lib/classBands.fixture'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { GradeRow } from '@/lib/queries/gradeScales'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import { buildReport, paginate, reportFileName, type ReportSemester } from './reportModel'
import { resolveToggles } from './themes'

const scale: GradeRow[] = [
  { grade: 'A', points: 4 },
  { grade: 'B+', points: 3.3 },
  { grade: 'B', points: 3 },
  { grade: 'C', points: 2 },
  { grade: 'F', points: 0 },
]

const honorsScale: GradeRow[] = [
  { grade: 'S1', points: 3.1 },
  { grade: 'S2', points: 3.54 },
  { grade: 'S3', points: 3.38 },
]

function degree(): DegreeWithScale {
  return {
    id: 'deg',
    user_id: 'user',
    title: "CS 26'",
    institution: 'NIBM',
    started_year: 2025,
    grade_scale_id: 'scale',
    created_at: '2025-01-01',
    grade_scale: {
      id: 'scale',
      user_id: null,
      label: 'Honours',
      is_system: true,
      grades: scale,
      classification_scheme_id: 'scheme',
      classification_scheme: {
        id: 'scheme',
        user_id: null,
        label: 'Sri Lankan honors',
        is_system: true,
        applies_up_to: 4.5,
        bands: SRI_LANKAN_HONORS_BANDS,
        created_at: '2025-01-01',
      },
      created_at: '2025-01-01',
    },
  }
}

function semester(
  id: string,
  title: string,
  modules: SemesterWithModules['modules'],
): SemesterWithModules {
  return {
    id,
    degree_id: 'deg',
    user_id: 'user',
    title,
    term: null,
    sem_index: Number(id.replace(/\D/g, '')) || 0,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    modules,
  }
}

function module(
  id: string,
  name: string,
  credits: number,
  grade: string,
  retakes: string | null = null,
): SemesterWithModules['modules'][number] {
  return {
    id,
    semester_id: 's',
    user_id: 'user',
    name,
    credits,
    grade,
    retakes_module_id: retakes,
    position: 0,
    created_at: '2025-01-01',
  }
}

const toggles = resolveToggles('formal', undefined, true).values

describe('export report model', () => {
  it('treats 3.10 and 3.54 on equal credits as a 3.32 cumulative, which is what the dashboard shows', () => {
    const report = buildReport({
      degree: { ...degree(), grade_scale: { ...degree().grade_scale!, grades: honorsScale } },
      semesters: [
        semester('s1', 'Year 1, Semester 1', [module('a', 'Algorithms', 15, 'S1')]),
        semester('s2', 'Year 1, Semester 2', [module('b', 'Systems', 15, 'S2')]),
      ],
      theme: 'formal',
      toggles,
      title: 'Transcript',
      studentName: 'Alex Morgan',
      studentId: 'CS26-0142',
      paper: 'A4',
      aspect: '4:5',
    })

    expect(report.semesters.map((item) => item.gpa)).toEqual([3.1, 3.54])
    expect(report.cgpa).toBe(3.32)
    const rows = report.semesters.flatMap((item) => item.modules)
    const credits = rows.reduce((sum, row) => sum + row.credits, 0)
    const points = rows.reduce((sum, row) => sum + (row.points ?? 0) * row.credits, 0)
    expect(Number((points / credits).toFixed(4))).toBe(report.cgpa)
  })

  it('uses the credit-weighted average, so the mock pair 3.38 and 3.54 is 3.46 rather than a second formula', () => {
    const report = buildReport({
      degree: { ...degree(), grade_scale: { ...degree().grade_scale!, grades: honorsScale } },
      semesters: [
        semester('s1', 'Year 1, Semester 1', [module('a', 'Algorithms', 15, 'S3')]),
        semester('s2', 'Year 1, Semester 2', [module('b', 'Systems', 15, 'S2')]),
      ],
      theme: 'formal',
      toggles,
      title: 'Transcript',
      studentName: 'Alex',
      studentId: '1',
      paper: 'A4',
      aspect: '4:5',
    })
    expect(report.cgpa).toBe(3.46)
  })

  it('drops a replaced attempt from the earlier semester so the tables still add up to the cumulative GPA', () => {
    const report = buildReport({
      degree: degree(),
      semesters: [
        semester('s1', 'Year 1, Semester 1', [
          module('failed', 'Databases', 3, 'F'),
          module('kept', 'Algorithms', 12, 'A'),
        ]),
        semester('s2', 'Year 1, Semester 2', [
          module('retake', 'Databases', 3, 'A', 'failed'),
          module('systems', 'Systems', 12, 'A'),
        ]),
      ],
      theme: 'formal',
      toggles,
      title: 'Transcript',
      studentName: 'Alex',
      studentId: '1',
      paper: 'A4',
      aspect: '4:5',
    })

    const visible = report.semesters.flatMap((item) => item.modules)
    expect(visible.map((row) => row.id)).not.toContain('failed')
    const credits = visible.reduce((sum, row) => sum + row.credits, 0)
    const points = visible.reduce((sum, row) => sum + (row.points ?? 0) * row.credits, 0)
    expect(Number((points / credits).toFixed(4))).toBe(report.cgpa)
    expect(report.classification).toBe('First')
  })

  it('omits ungraded modules unless in-progress semesters are included', () => {
    const semesters = [
      semester('s1', 'Year 1, Semester 1', [
        module('done', 'Algorithms', 3, 'A'),
        module('open', 'Project', 3, 'Not graded'),
      ]),
      semester('s2', 'Year 1, Semester 2', [module('later', 'Thesis', 15, 'Not graded')]),
    ]
    const hidden = buildReport({
      degree: degree(),
      semesters,
      theme: 'formal',
      toggles: { ...toggles, inProgressSemesters: false },
      title: 'Transcript',
      studentName: 'Alex',
      studentId: '1',
      paper: 'A4',
      aspect: '4:5',
    })
    const shown = buildReport({
      degree: degree(),
      semesters,
      theme: 'formal',
      toggles: { ...toggles, inProgressSemesters: true },
      title: 'Transcript',
      studentName: 'Alex',
      studentId: '1',
      paper: 'A4',
      aspect: '4:5',
    })
    expect(hidden.semesters.map((row) => row.id)).toEqual(['s1'])
    expect(hidden.semesters[0].modules.map((row) => row.id)).toEqual(['done'])
    expect(hidden.earnedCredits).toBe(3)
    expect(hidden.totalCredits).toBe(21)
    expect(shown.semesters[0].modules.find((row) => row.id === 'open')?.grade).toBe('In progress')
    expect(shown.cgpa).toBe(4)
    expect(shown.earnedCredits).toBe(3)
    expect(shown.totalCredits).toBe(21)
  })

  it('never places one semester on two pages', () => {
    const semesters: ReportSemester[] = Array.from({ length: 6 }, (_, index) => ({
      id: `s${index}`,
      title: `Semester ${index + 1}`,
      credits: 15,
      gpa: 3,
      graded: true,
      className: 'Second class upper',
      modules: Array.from({ length: 8 }, (__, row) => ({
        id: `${index}-${row}`,
        code: '00',
        name: 'Module',
        credits: 3,
        grade: 'A',
        points: 4,
        inProgress: false,
      })),
    }))
    const pages = paginate(semesters, { firstStart: 280, laterStart: 96, limit: 640 }, (semester) => 44 + 24 + semester.modules.length * 22 + 14)
    const seen = pages.flatMap((page) => page.semesterIds)
    expect(new Set(seen).size).toBe(seen.length)
    expect(seen).toHaveLength(6)
    expect(pages.length).toBeGreaterThan(1)
    expect(pages[0].showIntro).toBe(true)
    expect(pages[1].showIntro).toBe(false)
  })

  it('locks formal student details and hides social grade scale', () => {
    const formal = resolveToggles('formal', { studentDetails: false, gradeScale: false }, true)
    expect(formal.values.studentDetails).toBe(true)
    expect(formal.values.gradeScale).toBe(true)
    expect(formal.locked).toContain('studentDetails')
    const social = resolveToggles('social', undefined, true)
    expect(social.visible).not.toContain('gradeScale')
    expect(social.values.studentDetails).toBe(false)
    expect(social.values.hideExactGpa).toBe(false)
  })

  it('turns the classification ruler off when the scale has no class bands', () => {
    const wide: GradeRow[] = [{ grade: 'A', points: 100 }]
    const resolved = resolveToggles('ruler', { classificationRuler: true }, false)
    expect(resolved.disabled).toContain('classificationRuler')
    expect(resolved.values.classificationRuler).toBe(false)
    const report = buildReport({
      degree: {
        ...degree(),
        grade_scale: {
          ...degree().grade_scale!,
          grades: wide,
          classification_scheme_id: null,
          classification_scheme: null,
        },
      },
      semesters: [semester('s1', 'Year 1', [module('a', 'Algorithms', 3, 'A')])],
      theme: 'ruler',
      toggles: resolved.values,
      title: 'Transcript',
      studentName: 'Alex',
      studentId: '1',
      paper: 'A4',
      aspect: '4:5',
    })
    expect(report.hasClassBands).toBe(false)
    expect(report.show.classificationRuler).toBe(false)
  })

  it('slugifies the download name from the student and the degree', () => {
    expect(reportFileName('Alex Morgan', "CS 26'", 'pdf')).toBe('alex-morgan-cs-26-transcript.pdf')
    expect(reportFileName('Alex Morgan', "CS 26'", 'png')).toBe('alex-morgan-cs-26-card.png')
  })
})
