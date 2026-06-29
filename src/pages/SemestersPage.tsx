import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit2, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { computeScore, totalCredits } from '@/lib/score'
import { ClassificationBadge } from '@/components/ui/ClassificationBadge'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'

export default function SemestersPage() {
  const { degreeId } = useParams()
  const navigate = useNavigate()
  
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const { semesters, isLoading: isSemestersLoading, deleteSemester } = useSemesters(degreeId || '')

  const degree = degrees.find(d => d.id === degreeId)

  if (isDegreesLoading || isSemestersLoading) {
    return (
      <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end border-b border-[#1e3a5f] pb-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-32 bg-[#273449]" />
              <Skeleton className="h-8 w-64 bg-[#273449]" />
              <Skeleton className="h-4 w-48 bg-[#273449]" />
            </div>
            <Skeleton className="h-9 w-36 bg-[#273449]" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 bg-[#273449] rounded-sm" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!degree) {
    return (
      <div className="min-h-screen bg-[#1e293b] text-slate-100 flex flex-col items-center justify-center">
        <p>Degree not found.</p>
        <Button onClick={() => navigate('/degrees')} className="mt-4" variant="outline">
          Back to Degrees
        </Button>
      </div>
    )
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this semester?')) return
    try {
      await deleteSemester(id)
    } catch (err: any) {
      // toast is handled in the hook
    }
  }

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-[#1e3a5f] pb-6">
          <div className="flex flex-col gap-2">
            <Breadcrumb items={[{ label: degree.title }]} />
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-slate-100">
              {degree.title}
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              Manage semesters for this degree.
            </p>
          </div>
          <Button
            onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Semester
          </Button>
        </div>

        {/* Semesters Grid */}
        {semesters.length === 0 ? (
          <div className="bg-[#273449] border border-[#1e3a5f] border-dashed rounded-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-slate-300 font-mono text-lg mb-2">No semesters found</h3>
            <p className="text-slate-500 font-mono text-sm mb-6">Create your first semester to start calculating your GPA.</p>
            <Button
              onClick={() => navigate(`/degrees/${degreeId}/semesters/new`)}
              variant="outline"
              className="border-[#1e3a5f] text-emerald-400 hover:bg-[#1e3a5f] hover:text-emerald-300 rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              Add Semester
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {semesters.map((sem) => {
              const score = computeScore(sem.modules, degree.grade_scale?.grades || [])
              const credits = totalCredits(sem.modules)
              
              return (
                <div 
                  key={sem.id} 
                  onClick={() => navigate(`/degrees/${degreeId}/semesters/${sem.id}/edit`)}
                  className="bg-[#273449] border border-[#1e3a5f] rounded-sm p-6 relative group transition-all hover:border-emerald-400/50 cursor-pointer flex flex-col h-full"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/50"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-mono text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {sem.title}
                      </h3>
                      {sem.term && (
                        <p className="text-sm font-mono text-slate-400 mt-1">
                          {sem.term}
                        </p>
                      )}
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/degrees/${degreeId}/semesters/${sem.id}/edit`)
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(sem.id, e)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[#1e3a5f]/50 flex justify-between items-center">
                    <div className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      Credits: <span className="text-slate-300">{credits.toFixed(1)}</span>
                    </div>
                    <div className="bg-[#1e293b] text-emerald-400 px-3 py-1.5 rounded-sm text-sm font-mono font-bold tracking-widest flex items-center gap-2 border border-[#1e3a5f]">
                      <span>GPA: {score.toFixed(2)}</span>
                      <ClassificationBadge score={score} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
