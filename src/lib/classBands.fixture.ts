import type { Band } from './bands'

/**
 * Sample of the seeded "Sri Lankan honors" scheme for tests and the export QA page.
 * The database row is the source of truth. bands.test.ts checks this matches supabase/schema.sql.
 */
export const SRI_LANKAN_HONORS_BANDS: Band[] = [
  { id: 'pass', label: 'Pass', min: 2, max: 3, tone: 'pass' },
  { id: 'second-lower', label: 'Second lower', min: 3, max: 3.3, tone: 'second-lower' },
  { id: 'second-upper', label: 'Second upper', min: 3.3, max: 3.7, tone: 'second-upper' },
  { id: 'first', label: 'First', min: 3.7, max: 4, tone: 'first' },
]
