import type { Band } from './bands'
import type { SemesterWithModules } from './queries/semesters'
import type { GradeRow } from './queries/gradeScales'
import { attemptedCredits, computeScore, earnedCredits, hasGradedWork, standingLabel, ungradedCredits, withoutReplacedAttempts } from './score'

export function getCumulativeMetrics(semesters: SemesterWithModules[], gradeScale: GradeRow[], classBands: Band[] = []) {
  const allModules = withoutReplacedAttempts(semesters.flatMap(sem => sem.modules))
  
  const cgpa = computeScore(allModules, gradeScale)
  const earned = earnedCredits(allModules, gradeScale)
  const attempted = attemptedCredits(allModules, gradeScale)
  const ungraded = ungradedCredits(allModules, gradeScale)

  let highestGpa = 0
  semesters.forEach(sem => {
    const semGpa = computeScore(sem.modules, gradeScale)
    if (semGpa > highestGpa) {
      highestGpa = semGpa
    }
  })

  const standing = standingLabel(cgpa, hasGradedWork(allModules, gradeScale), classBands)

  return {
    cgpa,
    earnedCredits: earned,
    attemptedCredits: attempted,
    ungradedCredits: ungraded,
    highestGpa,
    standing
  }
}
