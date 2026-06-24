import type { SemesterWithModules } from './queries/semesters'
import type { GradeRow } from './queries/gradeScales'
import { computeScore, totalCredits } from './score'

export function getCumulativeMetrics(semesters: SemesterWithModules[], gradeScale: GradeRow[]) {
  const allModules = semesters.flatMap(sem => sem.modules)
  
  const cgpa = computeScore(allModules, gradeScale)
  const earnedCredits = totalCredits(allModules)

  let highestGpa = 0
  semesters.forEach(sem => {
    const semGpa = computeScore(sem.modules, gradeScale)
    if (semGpa > highestGpa) {
      highestGpa = semGpa
    }
  })

  let standing = 'Good Standing'
  if (cgpa >= 3.7) standing = 'First Class Honors'
  else if (cgpa >= 3.0) standing = 'Upper Second Class'
  else if (cgpa >= 2.0) standing = 'Lower Second Class'
  else if (cgpa > 0 && cgpa < 2.0) standing = 'Academic Warning'
  else standing = 'No Data'

  return {
    cgpa,
    earnedCredits,
    highestGpa,
    standing
  }
}
