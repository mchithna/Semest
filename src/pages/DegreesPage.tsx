import { useState } from 'react'
import { Plus, Edit2, Trash2, GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useDegrees } from '@/hooks/useDegrees'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import { CreateDegreeDialog } from '@/components/degrees/CreateDegreeDialog'
import { Button } from '@/components/ui/button'

export default function DegreesPage() {
  const { degrees, isLoading, createDegree, updateDegree, deleteDegree } = useDegrees()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingDegree, setEditingDegree] = useState<DegreeWithScale | undefined>()
  const navigate = useNavigate()

  const handleCreate = () => {
    setEditingDegree(undefined)
    setEditorOpen(true)
  }

  const handleEdit = (degree: DegreeWithScale, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDegree(degree)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this degree? All semesters and modules will be lost.')) return
    try {
      await deleteDegree(id)
      toast.success('Degree deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSave = async (data: any) => {
    if (editingDegree) {
      await updateDegree({ id: editingDegree.id, ...data })
      toast.success('Degree updated')
    } else {
      await createDegree(data)
      toast.success('Degree created')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1e293b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-[#1e3a5f] pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-emerald-400">
              My Degrees
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2">
              Manage your academic programs.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Degree
          </Button>
        </div>

        {/* Degrees Grid */}
        {degrees.length === 0 ? (
          <div className="bg-[#273449] border border-[#1e3a5f] border-dashed rounded-sm p-12 text-center">
            <GraduationCap className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-slate-300 font-mono text-lg mb-2">No degrees found</h3>
            <p className="text-slate-500 font-mono text-sm mb-6">Create your first degree to start tracking your progress.</p>
            <Button
              onClick={handleCreate}
              variant="outline"
              className="border-[#1e3a5f] text-emerald-400 hover:bg-[#1e3a5f] hover:text-emerald-300 rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              Create Degree
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {degrees.map((degree) => (
              <div 
                key={degree.id} 
                onClick={() => navigate(`/degrees/${degree.id}/semesters`)}
                className="bg-[#273449] border border-[#1e3a5f] rounded-sm p-6 relative group transition-all hover:border-emerald-400/50 cursor-pointer flex flex-col h-full"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/50"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-mono text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {degree.title}
                    </h3>
                    <p className="text-sm font-mono text-slate-400 mt-1">
                      {degree.institution || 'Unknown Institution'} {degree.start_year ? `• ${degree.start_year}` : ''}
                    </p>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleEdit(degree, e)}
                      className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(degree.id, e)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-[#1e3a5f]/50 flex justify-between items-center">
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                    Scale: <span className="text-slate-300">{degree.grade_scale?.label || 'None'}</span>
                  </div>
                  <div className="bg-emerald-400/10 text-emerald-400 px-2 py-1 rounded-sm text-xs font-mono font-bold tracking-widest">
                    GPA: --
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <CreateDegreeDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={editingDegree}
        onSave={handleSave}
      />
    </div>
  )
}
