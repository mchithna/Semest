import type { GradeRow } from './queries/gradeScales'

export type BackupScale = {
  id: string
  label: string
  is_system?: boolean
  grades: GradeRow[]
}

export type BackupModule = {
  name: string
  credits: number
  grade: string
}

export type BackupSemester = {
  title: string
  term?: string | null
  sem_index?: number
  modules?: BackupModule[]
}

export type BackupDegree = {
  title: string
  institution?: string | null
  started_year?: number | null
  grade_scale_id?: string | null
  semesters?: BackupSemester[]
}

export type BackupFile = {
  customScales: BackupScale[]
  degrees: BackupDegree[]
}

export function parseBackup(value: unknown): BackupFile {
  if (!value || typeof value !== 'object') throw new Error('This file is not a Semest backup')
  const record = value as { degrees?: unknown; customScales?: unknown }
  if (!Array.isArray(record.degrees)) throw new Error('This file is not a Semest backup')

  const customScales = Array.isArray(record.customScales)
    ? record.customScales.filter((scale) => scale && typeof scale === 'object' && Array.isArray((scale as BackupScale).grades)) as BackupScale[]
    : []

  return { customScales, degrees: record.degrees as BackupDegree[] }
}
