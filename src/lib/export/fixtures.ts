import { SRI_LANKAN_HONORS_BANDS } from '@/lib/classBands.fixture'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { ClassificationScheme } from '@/lib/queries/classificationSchemes'
import type { GradeRow } from '@/lib/queries/gradeScales'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { OptionKey } from './themes'

/** Realistic data for visual checks and tests. Nothing here is real student data. */

const SCALE_420: GradeRow[] = [
  { grade: 'A+', points: 4.2 },
  { grade: 'A', points: 4 },
  { grade: 'A-', points: 3.7 },
  { grade: 'B+', points: 3.3 },
  { grade: 'B', points: 3 },
  { grade: 'B-', points: 2.7 },
  { grade: 'C+', points: 2.3 },
  { grade: 'C', points: 2 },
  { grade: 'C-', points: 1.7 },
  { grade: 'D+', points: 1.3 },
  { grade: 'D', points: 1 },
  { grade: 'F', points: 0 },
]

const SCALE_400: GradeRow[] = [
  { grade: 'A', points: 4 },
  { grade: 'A-', points: 3.7 },
  { grade: 'B+', points: 3.3 },
  { grade: 'B', points: 3 },
  { grade: 'B-', points: 2.7 },
  { grade: 'C+', points: 2.3 },
  { grade: 'C', points: 2 },
  { grade: 'D', points: 1 },
  { grade: 'F', points: 0 },
]

const SCALE_PERCENT: GradeRow[] = [
  { grade: 'Distinction', points: 100 },
  { grade: 'Merit', points: 70 },
  { grade: 'Pass', points: 50 },
  { grade: 'Fail', points: 0 },
]

const HONORS_SCHEME: ClassificationScheme = {
  id: 'scheme',
  user_id: null,
  label: 'Sri Lankan honors',
  is_system: true,
  applies_up_to: 4.5,
  bands: SRI_LANKAN_HONORS_BANDS,
  created_at: '2026-01-01',
}

function degree(
  title: string,
  institution: string,
  grades: GradeRow[],
  scheme: ClassificationScheme | null = HONORS_SCHEME,
): DegreeWithScale {
  return {
    id: 'deg',
    user_id: 'user',
    title,
    institution,
    started_year: 2026,
    grade_scale_id: 'scale',
    created_at: '2026-01-01',
    grade_scale: {
      id: 'scale',
      user_id: null,
      label: 'Scale',
      is_system: false,
      grades,
      classification_scheme_id: scheme?.id ?? null,
      classification_scheme: scheme,
      created_at: '2026-01-01',
    },
  }
}

let counter = 0
function semester(index: number, title: string, rows: [string, number, string][]): SemesterWithModules {
  const id = `s${index}`
  return {
    id,
    degree_id: 'deg',
    user_id: 'user',
    title,
    term: null,
    sem_index: index,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    modules: rows.map(([name, credits, grade], position) => ({
      id: `${id}-m${(counter += 1)}`,
      semester_id: id,
      user_id: 'user',
      name,
      credits,
      grade,
      retakes_module_id: null,
      position,
      created_at: '2026-01-01',
    })),
  }
}

const YEAR_ONE: SemesterWithModules[] = [
  semester(1, 'Year 1, Semester 1', [
    ['Programming Fundamentals', 3, 'A'],
    ['Discrete Mathematics', 3, 'B+'],
    ['Computer Systems', 3, 'C+'],
    ['Web Technologies', 3, 'C-'],
    ['Communication Skills', 3, 'A+'],
  ]),
  semester(2, 'Year 1, Semester 2', [
    ['Data Structures', 3, 'B-'],
    ['Databases', 3, 'A'],
    ['Object-Oriented Design', 3, 'A'],
    ['Operating Systems', 3, 'A-'],
    ['Statistics', 3, 'B+'],
  ]),
]

const GRADE_CYCLE = ['A', 'A-', 'B+', 'B', 'A+', 'B-', 'A', 'C+']
const TOPICS = [
  'Algorithms',
  'Networks',
  'Software Engineering',
  'Human-Computer Interaction',
  'Machine Learning',
  'Cloud Computing',
  'Security',
  'Mobile Development',
  'Compilers',
  'Distributed Systems',
  'Computer Graphics',
  'Research Methods',
]

function manySemesters(count: number): SemesterWithModules[] {
  return Array.from({ length: count }, (_, i) =>
    semester(
      i + 1,
      `Year ${Math.floor(i / 2) + 1}, Semester ${(i % 2) + 1}`,
      Array.from({ length: 5 }, (__, m) => [
        TOPICS[(i * 5 + m) % TOPICS.length],
        3,
        GRADE_CYCLE[(i * 3 + m * 2) % GRADE_CYCLE.length],
      ] as [string, number, string]),
    ),
  )
}

export type QaFixture = {
  id: string
  label: string
  degree: DegreeWithScale
  semesters: SemesterWithModules[]
  studentName: string
  studentId: string
  /** extra toggle overrides on top of the theme defaults */
  toggles?: Partial<Record<OptionKey, boolean>>
  target?: number | null
}

export const FIXTURES: QaFixture[] = [
  {
    id: 'two',
    label: 'Two graded semesters',
    degree: degree("CS 26'", 'NIBM', SCALE_420),
    semesters: YEAR_ONE,
    studentName: 'Alex Morgan',
    studentId: 'CS26-0142',
  },
  {
    id: 'eight',
    label: 'Eight semesters',
    degree: degree("CS 26'", 'NIBM', SCALE_420),
    semesters: manySemesters(8),
    studentName: 'Alex Morgan',
    studentId: 'CS26-0142',
    toggles: { semesterTables: true },
  },
  {
    id: 'long',
    label: 'Very long names',
    degree: degree(
      'Bachelor of Science (Honours) in Computer Science and Software Engineering with Industrial Placement',
      'Northern Institute of Business Management and Information Technology, Colombo Campus',
      SCALE_420,
    ),
    semesters: [
      semester(1, 'Year 1, Semester 1, January to June intake with extended practical placement', [
        ['Introduction to Programming and Computational Thinking for Engineers and Scientists', 3, 'A'],
        ['Mathematics for Computing: Discrete Structures, Logic and Probability', 3, 'B+'],
        ['Computer Organisation, Operating Systems and Systems Programming', 3, 'A-'],
      ]),
      semester(2, 'Year 1, Semester 2', [
        ['Data Structures and Algorithms with Applications in Large-Scale Distributed Systems', 3, 'B'],
        ['Professional Practice, Ethics and Communication', 3, 'A'],
      ]),
    ],
    studentName: 'Alexandria Montgomery-Featherstonehaugh',
    studentId: 'CS26-0142-EXT-77',
  },
  {
    id: 'nobands',
    label: 'No classification bands',
    degree: degree('MBA Part Time', 'Colombo Business School', SCALE_PERCENT, null),
    semesters: [
      semester(1, 'Semester 1', [
        ['Strategic Management', 3, 'Distinction'],
        ['Financial Accounting', 3, 'Merit'],
      ]),
      semester(2, 'Semester 2', [
        ['Marketing Analytics', 3, 'Merit'],
        ['Operations', 3, 'Pass'],
      ]),
    ],
    studentName: 'Alex Morgan',
    studentId: 'MBA-0042',
  },
  {
    id: 'noname',
    label: 'Empty student name',
    degree: degree("CS 26'", 'NIBM', SCALE_420),
    semesters: YEAR_ONE,
    studentName: '',
    studentId: '',
  },
  {
    id: 'hidden',
    label: 'Hide exact GPA',
    degree: degree("CS 26'", 'NIBM', SCALE_420),
    semesters: YEAR_ONE,
    studentName: 'Alex Morgan',
    studentId: 'CS26-0142',
    toggles: { hideExactGpa: true, semesterTables: true },
    target: 3.7,
  },
  {
    id: 'scale400',
    label: 'Scale maximum 4.00',
    degree: degree("CS 26'", 'NIBM', SCALE_400),
    semesters: YEAR_ONE.map((sem) => ({
      ...sem,
      modules: sem.modules.map((mod) => ({ ...mod, grade: mod.grade === 'A+' ? 'A' : mod.grade === 'C-' ? 'C' : mod.grade })),
    })),
    studentName: 'Alex Morgan',
    studentId: 'CS26-0142',
  },
  {
    id: 'target',
    label: 'Target goal on',
    degree: degree("CS 26'", 'NIBM', SCALE_420),
    semesters: YEAR_ONE,
    studentName: 'Alex Morgan',
    studentId: 'CS26-0142',
    toggles: { targetGoal: true, semesterTables: true },
    target: 3.7,
  },
]

export const FIXTURE_BY_ID = Object.fromEntries(FIXTURES.map((fixture) => [fixture.id, fixture])) as Record<string, QaFixture>
