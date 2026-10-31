export type ThemeId = 'formal' | 'ruler' | 'social'

export type OptionKey =
  | 'studentDetails'
  | 'degreeInstitution'
  | 'summaryFigures'
  | 'semesterTables'
  | 'classificationRuler'
  | 'gradeScale'
  | 'inProgressSemesters'
  | 'registrarEndorsement'
  | 'targetGoal'
  | 'hideExactGpa'

export interface ThemeConfig {
  id: ThemeId
  label: string
  output: 'pdf' | 'png'
  outputLabel: string
  defaults: Partial<Record<OptionKey, boolean>>
  locked: OptionKey[]
  hidden: OptionKey[]
}

export const OPTION_LABELS: Record<OptionKey, string> = {
  studentDetails: 'Student details',
  degreeInstitution: 'Degree and institution',
  summaryFigures: 'Summary figures',
  semesterTables: 'Semester tables',
  classificationRuler: 'Classification ruler',
  gradeScale: 'Grade scale',
  inProgressSemesters: 'In-progress semesters',
  registrarEndorsement: 'Registrar endorsement',
  targetGoal: 'Target goal',
  hideExactGpa: 'Hide exact GPA',
}

export const OPTION_ORDER: OptionKey[] = [
  'studentDetails',
  'degreeInstitution',
  'summaryFigures',
  'semesterTables',
  'gradeScale',
  'classificationRuler',
  'inProgressSemesters',
  'registrarEndorsement',
  'targetGoal',
  'hideExactGpa',
]

export const THEMES: Record<ThemeId, ThemeConfig> = {
  formal: {
    id: 'formal',
    label: 'Formal report',
    output: 'pdf',
    outputLabel: 'PDF',
    defaults: {
      studentDetails: true,
      degreeInstitution: true,
      summaryFigures: true,
      semesterTables: true,
      classificationRuler: false,
      gradeScale: true,
      inProgressSemesters: false,
      registrarEndorsement: false,
    },
    locked: ['studentDetails', 'gradeScale'],
    hidden: ['targetGoal', 'hideExactGpa'],
  },
  ruler: {
    id: 'ruler',
    label: 'Ruler',
    output: 'pdf',
    outputLabel: 'PDF',
    defaults: {
      studentDetails: true,
      degreeInstitution: true,
      summaryFigures: true,
      semesterTables: true,
      classificationRuler: true,
      gradeScale: true,
      inProgressSemesters: false,
      targetGoal: false,
    },
    locked: [],
    hidden: ['registrarEndorsement', 'hideExactGpa'],
  },
  social: {
    id: 'social',
    label: 'Social card',
    output: 'png',
    outputLabel: 'PNG',
    defaults: {
      studentDetails: false,
      degreeInstitution: true,
      summaryFigures: true,
      semesterTables: false,
      classificationRuler: true,
      targetGoal: false,
      hideExactGpa: false,
    },
    locked: [],
    hidden: ['gradeScale', 'inProgressSemesters', 'registrarEndorsement'],
  },
}

export const THEME_ORDER: ThemeId[] = ['formal', 'ruler', 'social']

export type ResolvedToggles = {
  values: Record<OptionKey, boolean>
  visible: OptionKey[]
  locked: OptionKey[]
  disabled: OptionKey[]
}

export function resolveToggles(
  themeId: ThemeId,
  overrides: Partial<Record<OptionKey, boolean>> | undefined,
  hasClassBands: boolean,
): ResolvedToggles {
  const theme = THEMES[themeId]
  const values = {} as Record<OptionKey, boolean>
  for (const key of OPTION_ORDER) {
    const fallback = theme.defaults[key] ?? false
    const override = overrides?.[key]
    values[key] = theme.locked.includes(key) ? true : override ?? fallback
  }
  const disabled: OptionKey[] = []
  if (!hasClassBands && !theme.hidden.includes('classificationRuler')) {
    disabled.push('classificationRuler')
    values.classificationRuler = false
  }
  return {
    values,
    visible: OPTION_ORDER.filter((key) => !theme.hidden.includes(key)),
    locked: theme.locked,
    disabled,
  }
}

/** A4 everywhere except locales that print on Letter. Sri Lanka stays on A4. */
export function defaultPaper(language = typeof navigator === 'undefined' ? 'en-LK' : navigator.language): 'A4' | 'LETTER' {
  return /-(US|CA|MX|PH)\b/i.test(language) ? 'LETTER' : 'A4'
}
