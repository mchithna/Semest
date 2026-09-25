import type { SemesterWithModules } from './queries/semesters'
import type { GradeRow } from './queries/gradeScales'
import { computeScore, earnedCredits, hasGradedWork, standingLabel } from './score'

export function getCumulativeMetrics(semesters: SemesterWithModules[], gradeScale: GradeRow[]) {
  const allModules = semesters.flatMap(sem => sem.modules)
  
  const cgpa = computeScore(allModules, gradeScale)
  const earned = earnedCredits(allModules, gradeScale)

  let highestGpa = 0
  semesters.forEach(sem => {
    const semGpa = computeScore(sem.modules, gradeScale)
    if (semGpa > highestGpa) {
      highestGpa = semGpa
    }
  })

  const standing = standingLabel(cgpa, hasGradedWork(allModules, gradeScale))

  return {
    cgpa,
    earnedCredits: earned,
    highestGpa,
    standing
  }
}
