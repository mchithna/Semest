/** Display names for the seeded system scales. Database labels stay unchanged. */

export const SYSTEM_SCALES = [
  {
    match: 'Standard 4.0',
    name: 'Standard GPA Scale',
    body: 'Standard A+ (4.0) to F grading scale used by most universities.',
  },
  {
    match: 'Sri Lankan UGC GPA',
    name: '4.2 UGC Scale ( A+ = 4.2 )',
    body: 'Enhanced scale used by state & technical faculties (e.g., Moratuwa) where A+ awards 4.2 points.',
  },
] as const

const byLabel = new Map(SYSTEM_SCALES.map((scale) => [scale.match, scale.name]))

export function scaleDisplayName(scale: { label: string; is_system?: boolean }) {
  if (scale.is_system === false) return scale.label
  return byLabel.get(scale.label) ?? scale.label
}
