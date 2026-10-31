import { useEffect, useState } from 'react'
import { getProfile } from '@/lib/queries/profiles'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { useAuth } from '@/context/AuthContext'
import { getCumulativeMetrics } from '@/lib/analytics'
import { computeScore, formatGpa, hasGradedWork, totalCredits } from '@/lib/score'
import { bandsForScale, nextBandSentence, standingSentence, type RulerMarker } from '@/lib/bands'
import { MiniRuler } from '@/components/ruler/MiniRuler'
import { Ruler } from '@/components/ruler/Ruler'
import { TargetPredictor } from '@/components/dashboard/TargetPredictor'
import { ExportReportModal } from '@/components/export/ExportReportModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import type { GradeRow } from '@/lib/queries/gradeScales'
import type { SemesterWithModules } from '@/lib/queries/semesters'

const DEGREE_STORAGE_KEY = 'semest-active-degree'

function rememberedDegreeId() {
  const fromUrl = new URLSearchParams(window.location.search).get('degree')
  return fromUrl || localStorage.getItem(DEGREE_STORAGE_KEY) || ''
}

function formatCredits(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const [activeDegreeId, setActiveDegreeId] = useState(rememberedDegreeId)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [studentName, setStudentName] = useState('')
  const [target, setTarget] = useState<number | null>(null)

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setStudentName(profile?.display_name || user?.email?.split('@')[0] || '')
      })
      .catch(() => setStudentName(user?.email?.split('@')[0] || ''))
  }, [user])

  const activeDegree = degrees.find((degree) => degree.id === activeDegreeId)
  const { semesters, isLoading: isSemestersLoading } = useSemesters(activeDegreeId)
  const degreeParam = searchParams.get('degree')
  const scale = activeDegree?.grade_scale?.grades || []
  const track = bandsForScale(scale)

  useEffect(() => {
    if (degrees.length === 0) return
    const stored = localStorage.getItem(DEGREE_STORAGE_KEY)
    const candidate = degreeParam || stored || activeDegreeId
    const next = degrees.some((degree) => degree.id === candidate) ? candidate : degrees[0].id
    if (next !== activeDegreeId) setActiveDegreeId(next)
    localStorage.setItem(DEGREE_STORAGE_KEY, next)
    if (degreeParam !== next) setSearchParams({ degree: next }, { replace: true })
  }, [degrees, degreeParam, activeDegreeId, setSearchParams])

  useEffect(() => {
    const bands = bandsForScale(scale).bands.filter((band) => band.tone !== 'plain' && band.label)
    setTarget(bands.at(-1)?.min ?? null)
  }, [activeDegreeId, activeDegree?.grade_scale?.id])

  const chooseDegree = (id: string) => {
    setActiveDegreeId(id)
    localStorage.setItem(DEGREE_STORAGE_KEY, id)
    setSearchParams({ degree: id }, { replace: true })
  }

  if (isDegreesLoading) {
    return (
      <div role="status" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="h-24 w-48 animate-pulse rounded-full bg-muted" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (degrees.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <div className="w-full rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
          <MiniRuler track={bandsForScale([])} value={null} className="mb-8" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">No degrees yet</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Set up a degree before tracking a GPA.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/degrees')}>
            Set up a degree
          </Button>
        </div>
      </div>
    )
  }

  const metrics = getCumulativeMetrics(semesters, scale)
  const graded = metrics.attemptedCredits > 0
  const standing = standingSentence(metrics.cgpa, graded, track)
  const next = graded ? nextBandSentence(metrics.cgpa, track) : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        degree={activeDegree}
        semesters={semesters}
        defaultStudentName={studentName}
        targetCgpa={target}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {isSemestersLoading ? (
          <div role="status" className="space-y-6">
            <div className="h-24 w-48 animate-pulse rounded-full bg-muted" />
            <div className="h-10 animate-pulse rounded-full bg-muted" />
            <span className="sr-only">Loading</span>
          </div>
        ) : (
          <>
            <div className="relative">
              <div className="mb-8 flex flex-wrap items-center justify-end gap-2 lg:absolute lg:top-0 lg:right-0 lg:mb-0">
                <Select value={activeDegreeId} onValueChange={chooseDegree}>
                  <SelectTrigger
                    aria-label="Degree"
                    className="h-10 w-full max-w-[14rem] rounded-full border-foreground/20 bg-transparent px-4 sm:w-auto"
                  >
                    <SelectValue placeholder="Degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {degrees.map((degree) => (
                      <SelectItem key={degree.id} value={degree.id}>
                        {degree.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsExportModalOpen(true)} disabled={!activeDegree || isSemestersLoading}>
                  Export
                </Button>
              </div>
              <div className="grid items-end gap-6 lg:grid-cols-[1.3fr_0.9fr]">
                <div>
                  <p className="text-sm text-muted-foreground">Cumulative GPA</p>
                  <h1 className="mt-2 font-display text-7xl font-semibold tabular-nums tracking-tight sm:text-8xl">
                    {graded ? <AnimatedNumber value={metrics.cgpa} decimals={2} /> : '—'}
                  </h1>
                </div>
                <div className="max-w-md lg:pt-16 lg:pb-2">
                  {standing && (
                    <p className="font-display text-2xl font-semibold tracking-tight sm:text-[1.7rem]">{standing}</p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {[next, creditSentence(metrics.attemptedCredits, metrics.ungradedCredits)].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            </div>

            <Ruler className="mt-8" track={track} markers={rulerMarkers(metrics.cgpa, graded, target, semesters, scale)} />

            <div className="mt-12">
              <h2 className="mb-2 text-lg font-semibold">Semesters</h2>
              <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_0.9fr]">
              <section>
                {semesters.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-foreground/20 px-6 py-10 text-center">
                    <MiniRuler track={track} value={null} className="mb-6" />
                    <p className="text-sm text-muted-foreground">No semesters yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/70">
                    {semesters.map((semester) => {
                      const semesterGraded = hasGradedWork(semester.modules, scale)
                      const score = computeScore(semester.modules, scale)
                      const credits = totalCredits(semester.modules)
                      return (
                        <li key={semester.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
                          <div className="w-full shrink-0 sm:w-44">
                            <p className="text-sm font-medium">{semester.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {semester.modules.length === 0
                                ? 'No modules added'
                                : `${formatCredits(credits)} credits`}
                            </p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <MiniRuler track={track} value={semesterGraded ? score : null} />
                          </div>
                          {semesterGraded ? (
                            <p className="font-display text-2xl font-semibold tabular-nums sm:w-16 sm:text-right">
                              {formatGpa(score)}
                            </p>
                          ) : (
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/degrees/${activeDegreeId}/semesters/${semester.id}/edit`}>Add grades</Link>
                            </Button>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <TargetPredictor
                currentCgpa={metrics.cgpa}
                gradedCredits={metrics.attemptedCredits}
                highestGpa={metrics.highestGpa}
                gradeScale={scale}
                initialRemaining={metrics.ungradedCredits}
                target={target}
                onTargetChange={setTarget}
              />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function creditSentence(gradedCredits: number, ungradedCredits: number): string {
  if (gradedCredits <= 0) return 'No credits are graded yet.'
  const graded = formatCredits(gradedCredits)
  if (ungradedCredits > 0) {
    return `${graded} graded, ${formatCredits(ungradedCredits)} still unmarked.`
  }
  return `${graded} ${gradedCredits === 1 ? 'credit is' : 'credits are'} graded so far.`
}

function rulerMarkers(
  cgpa: number,
  graded: boolean,
  target: number | null,
  semesters: SemesterWithModules[],
  scale: GradeRow[],
): RulerMarker[] {
  const markers: RulerMarker[] = []
  if (graded) markers.push({ id: 'you', value: cgpa, label: `You ${formatGpa(cgpa)}`, kind: 'you' })
  if (target !== null && Number.isFinite(target)) {
    markers.push({ id: 'target', value: target, label: `Target ${formatGpa(target)}`, kind: 'target' })
  }
  semesters.forEach((semester) => {
    if (!hasGradedWork(semester.modules, scale)) return
    const score = computeScore(semester.modules, scale)
    markers.push({ id: semester.id, value: score, label: semester.title, kind: 'dot' })
  })
  return markers
}
