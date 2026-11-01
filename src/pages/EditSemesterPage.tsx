import { useState } from 'react'
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

export default function EditSemesterPage() {
  const { degreeId, id: semesterId } = useParams()
  const navigate = useNavigate()
  
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const { semesters, isLoading: isSemestersLoading, saveSemester, isSaving } = useSemesters(degreeId || '')

  const degree = degrees.find(d => d.id === degreeId)
  const semester = semesters.find(s => s.id === semesterId)

  const [form, setForm] = useState<{ id: string; title: string; term: string } | null>(null)
  if (semester && form?.id !== semester.id) {
    setForm({ id: semester.id, title: semester.title, term: semester.term || '' })
  }
  const formReady = Boolean(form && semester && form.id === semester.id)
  const title = formReady && form ? form.title : (semester?.title ?? '')
  const term = formReady && form ? form.term : (semester?.term ?? '')
  const detailsChanged = Boolean(
    semester && (title !== semester.title || term !== (semester.term || ''))
  )

  if (isDegreesLoading || isSemestersLoading) {
    return (
      <div role="status" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <title>Edit semester · Semest</title>
        <span className="sr-only">Loading</span>
        <div className="h-4 w-48 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-14 w-72 animate-pulse rounded-full bg-muted" />
        <div className="mt-10 h-40 animate-pulse rounded-[22px] bg-muted" />
      </div>
    )
  }

  if (!degree || !semester || !degreeId) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <title>Edit semester · Semest</title>
        <div className="w-full rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
          <MiniRuler track={bandsForScale([])} value={null} className="mb-8" />
          <h1 className="font-display text-3xl font-semibold tracking-tight">Semester not found</h1>
          <Button variant="outline" className="mt-6" onClick={() => navigate(`/degrees/${degreeId}/semesters`)}>
            Back to semesters
          </Button>
        </div>
      </div>
    )
  }

  const initialModules: ModuleData[] = semester.modules.map(m => ({
    id: m.id,
    name: m.name,
    credits: m.credits,
    grade: m.grade,
    retakesModuleId: m.retakes_module_id || null,
  }))
  const priorModules = earlierModuleOptions(semesters, semester.sem_index)

  const handleSave = async (modules: ModuleData[]) => {
    await saveSemester({
      semesterId: semester.id,
      title,
      term,
      modules
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>Edit semester · Semest</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Breadcrumb
          items={[
            { label: degree.title, path: `/degrees/${degreeId}/semesters` },
            { label: 'Edit semester' },
          ]}
        />
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          Edit semester
        </h1>
        <Calculator
          className="mt-8"
          key={semester.id}
          initialModules={initialModules}
          gradeScale={degree.grade_scale?.grades || []}
          classBands={classBandsOf(degree.grade_scale)}
          priorModules={priorModules}
          baselineModules={initialModules}
          savedElsewhere={semesters.filter((item) => item.id !== semester.id).flatMap((item) => item.modules)}
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
                  onChange={(event) => setForm({ id: semester.id, title: event.target.value, term })}
                  placeholder="e.g. Year 1, Semester 1"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester-term">Term (optional)</Label>
                <Input
                  id="semester-term"
                  value={term}
                  onChange={(event) => setForm({ id: semester.id, title, term: event.target.value })}
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
