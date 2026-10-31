import type { GradeRow } from './queries/gradeScales'
import { attemptedCredits, computeScore, hasGradedWork, withoutReplacedAttempts, type RetakeModule } from './score'

export type Projection = {
  before: number
  after: number
  beforeGraded: boolean
  afterGraded: boolean
  gradedCredits: number
}

/** Cumulative GPA of the saved degree, then the same total with this draft in place of its baseline. */
export function projectCumulative(
  savedElsewhere: RetakeModule[],
  baseline: RetakeModule[],
  draft: RetakeModule[],
  scale: GradeRow[],
): Projection {
  const beforeModules = withoutReplacedAttempts([...savedElsewhere, ...baseline])
  const afterModules = withoutReplacedAttempts([...savedElsewhere, ...draft])
  return {
    before: computeScore(beforeModules, scale),
    after: computeScore(afterModules, scale),
    beforeGraded: hasGradedWork(beforeModules, scale),
    afterGraded: hasGradedWork(afterModules, scale),
    gradedCredits: attemptedCredits(draft, scale),
  }
}
