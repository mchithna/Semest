import { useRef, useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { earlierModuleOptions } from '@/lib/priorModules'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { MiniRuler } from '@/components/ruler/MiniRuler'
import { bandsForScale, classBandsOf } from '@/lib/bands'
import { loadGuestDraft, sameGradeScale } from '@/lib/guestDraft'
import { toast } from 'sonner'

export default function NewSemesterPage() {
  const { degreeId } = useParams()
  const navigate = useNavigate()
  
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const { semesters, saveSemester, isSaving } = useSemesters(degreeId || '')

  const [title, setTitle] = useState('Year 1, Semester 1')
  const [term, setTerm] = useState('')
  const [initialModules, setInitialModules] = useState<ModuleData[]>([])
  const openedAs = useRef({ title, term })
  const detailsChanged = title !== openedAs.current.title || term !== openedAs.current.term

  useEffect(() => {
    if (isDegreesLoading) return
    const saved = sessionStorage.getItem('semest_guest_draft')
    if (!saved) return
    try {
      const draft = loadGuestDraft(saved)
      if (draft) setInitialModules(draft.modules)
      sessionStorage.removeItem('semest_guest_draft')
      const degreeScale = degrees.find((item) => item.id === degreeId)?.grade_scale?.grades
      if (draft && degreeScale && !sameGradeScale(draft.grades, degreeScale)) {
        toast.warning(`This draft was calculated on ${draft.scaleLabel}. This degree uses a different scale, so the GPA can change.`)
      }
    } catch {
      sessionStorage.removeItem('semest_guest_draft')
    }
  }, [isDegreesLoading, degrees, degreeId])

  const degree = degrees.find(d => d.id === degreeId)

  if (isDegreesLoading) {
    return (
      <div role="status" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <title>New semester · Semest</title>
        <span className="sr-only">Loading</span>
        <div className="h-4 w-48 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-14 w-72 animate-pulse rounded-full bg-muted" />
        <div className="mt-10 h-40 animate-pulse rounded-[22px] bg-muted" />
      </div>
    )
  }

  if (!degree || !degreeId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <title>New semester · Semest</title>
        <div className="w-full rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
          <MiniRuler track={bandsForScale([])} value={null} className="mb-8" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Degree not found</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/degrees')}>
            Back to Degrees
          </Button>
        </div>
      </div>
    )
  }

  const handleSave = async (modules: ModuleData[]) => {
    await saveSemester({
      title,
      term,
      modules
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>New semester · Semest</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumb
          items={[
            { label: degree.title, path: `/degrees/${degreeId}/semesters` },
            { label: 'New semester' },
          ]}
        />
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          New semester
        </h1>
        <Calculator
          className="mt-8"
          key={initialModules.length ? 'loaded' : 'empty'}
          initialModules={initialModules}
          gradeScale={degree.grade_scale?.grades || []}
          classBands={classBandsOf(degree.grade_scale)}
          priorModules={earlierModuleOptions(semesters, null)}
          savedElsewhere={semesters.flatMap((semester) => semester.modules)}
          detailsChanged={detailsChanged}
          onSave={handleSave}
          onComplete={() => navigate(`/degrees/${degreeId}/semesters`)}
          isSaving={isSaving}
          details={
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)]">
              <div className="space-y-2">
                <Label htmlFor="semester-title">Title</Label>
                <Input
                  id="semester-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Year 1, Semester 1"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester-term">Term (optional)</Label>
                <Input
                  id="semester-term"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="rounded-xl"
                />
              </div>
            </div>
          }
        />
      </div>
    </div>
  )
}
