import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { earlierModuleOptions } from '@/lib/priorModules'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

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
      <div role="status" className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (!degree || !semester) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <p>Semester not found.</p>
        <Link to={`/degrees/${degreeId}/semesters`} className="mt-4 text-primary underline">Back</Link>
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
    try {
      await saveSemester({
        semesterId: semester.id,
        title,
        term,
        modules
      })
      navigate(`/degrees/${degreeId}/semesters`)
    } catch (e) {
      // handled
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-slideUp">
        
        <div className="flex flex-col gap-2 border-b pb-6">
          <Breadcrumb 
            items={[
              { label: degree.title, path: `/degrees/${degreeId}/semesters` },
              { label: 'Edit semester' }
            ]} 
          />
          <h1 className="text-2xl font-sans font-bold tracking-tight text-foreground">
            Edit semester
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto bg-card p-6 border border-border rounded-xl mb-8">
          <div className="space-y-2">
            <Label htmlFor="semester-title" className="text-muted-foreground font-mono uppercase tracking-widest text-xs">Title</Label>
            <Input 
              id="semester-title"
              value={title} 
              onChange={(e) => setForm({ id: semester.id, title: e.target.value, term })} 
              placeholder="e.g. Year 1, Semester 1"
              className="bg-background border-border text-foreground font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semester-term" className="text-muted-foreground font-mono uppercase tracking-widest text-xs">Term (Optional)</Label>
            <Input 
              id="semester-term"
              value={term} 
              onChange={(e) => setForm({ id: semester.id, title, term: e.target.value })} 
              placeholder="e.g. Fall 2026"
              className="bg-background border-border text-foreground font-mono"
            />
          </div>
        </div>

        <Calculator
          key={semester.id}
          initialModules={initialModules}
          gradeScale={degree.grade_scale?.grades || []}
          priorModules={priorModules}
          baselineModules={initialModules}
          detailsChanged={detailsChanged}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  )
}
