import { OPTION_ORDER, THEME_ORDER, type OptionKey, type ThemeId } from './themes'

const IDENTITY_KEY = 'semest-export-identity'
const OPTIONS_KEY = 'semest-export-theme-options'

export type ExportIdentity = {
  studentName: string
  studentId: string
}

export type ThemeOverrides = Partial<Record<ThemeId, Partial<Record<OptionKey, boolean>>>>

function read<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadIdentity(): ExportIdentity {
  const stored = read<Partial<ExportIdentity>>(IDENTITY_KEY, {})
  return {
    studentName: typeof stored.studentName === 'string' ? stored.studentName : '',
    studentId: typeof stored.studentId === 'string' ? stored.studentId : '',
  }
}

export function saveIdentity(identity: ExportIdentity) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
}

export function loadOverrides(): ThemeOverrides {
  const stored = read<ThemeOverrides>(OPTIONS_KEY, {})
  const clean: ThemeOverrides = {}
  for (const themeId of THEME_ORDER) {
    const source = stored[themeId]
    if (!source || typeof source !== 'object') continue
    const next: Partial<Record<OptionKey, boolean>> = {}
    for (const key of OPTION_ORDER) {
      if (typeof source[key] === 'boolean') next[key] = source[key]
    }
    clean[themeId] = next
  }
  return clean
}

export function saveOverrides(overrides: ThemeOverrides) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(overrides))
}
