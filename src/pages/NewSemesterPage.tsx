import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Breadcrumb } from '@/components/layout/Breadcrumb'

export default function NewSemesterPage() {
  const { degreeId } = useParams()
  const navigate = useNavigate()
  
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const { saveSemester, isSaving } = useSemesters(degreeId || '')

  const [title, setTitle] = useState('Year 1, Semester 1')
  const [term, setTerm] = useState('')
  const [initialModules, setInitialModules] = useState<ModuleData[]>([])

  useEffect(() => {
    const saved = sessionStorage.getItem('semest_guest_draft')
    if (saved) {
      try {
        setInitialModules(JSON.parse(saved))
        sessionStorage.removeItem('semest_guest_draft') // Clear it after loading
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const degree = degrees.find(d => d.id === degreeId)

  if (isDegreesLoading) {
    return (
      <div className="min-h-screen bg-[#1e293b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!degree) {
    return (
      <div className="min-h-screen bg-[#1e293b] text-slate-100 flex flex-col items-center justify-center">
        <p>Degree not found.</p>
        <Link to="/degrees" className="mt-4 text-emerald-400 underline">Back</Link>
      </div>
    )
  }

  const handleSave = async (modules: ModuleData[]) => {
    try {
      await saveSemester({
        title,
        term,
        modules
      })
      navigate(`/degrees/${degreeId}/semesters`)
    } catch (e) {
      // handled by useSemesters toast
    }
  }

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-slideUp">
        
        <div className="flex flex-col gap-2 border-b border-[#1e3a5f] pb-6">
          <Breadcrumb 
            items={[
              { label: degree.title, path: `/degrees/${degreeId}/semesters` },
              { label: 'New Semester' }
            ]} 
          />
          <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-slate-100">
            New Semester
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto bg-[#273449] p-6 border border-[#1e3a5f] rounded-sm mb-8">
          <div className="space-y-2">
            <Label className="text-slate-300 font-mono uppercase tracking-widest text-xs">Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Year 1, Semester 1"
              className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300 font-mono uppercase tracking-widest text-xs">Term (Optional)</Label>
            <Input 
              value={term} 
              onChange={(e) => setTerm(e.target.value)} 
              placeholder="e.g. Fall 2026"
              className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono"
            />
          </div>
        </div>

        <Calculator 
          key={initialModules.length ? 'loaded' : 'empty'}
          initialModules={initialModules}
          gradeScale={degree.grade_scale?.grades || []}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  )
}
