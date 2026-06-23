import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useGradeScales } from '@/hooks/useGradeScales'
import type { GradeScale } from '@/lib/queries/gradeScales'
import { GradeScaleEditor } from '@/components/settings/GradeScaleEditor'
import { Button } from '@/components/ui/button'

export default function ScalesPage() {
  const { scales, isLoading, createScale, updateScale, deleteScale } = useGradeScales()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingScale, setEditingScale] = useState<GradeScale | undefined>()

  const systemScales = scales.filter(s => s.is_system)
  const userScales = scales.filter(s => !s.is_system)

  const handleCreate = () => {
    setEditingScale(undefined)
    setEditorOpen(true)
  }

  const handleEdit = (scale: GradeScale) => {
    setEditingScale(scale)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scale? Any degrees using it will lose their scale association.')) return
    try {
      await deleteScale(id)
      toast.success('Scale deleted')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSave = async (label: string, grades: any[]) => {
    if (editingScale) {
      await updateScale({ id: editingScale.id, label, grades })
    } else {
      await createScale({ label, grades })
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
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-[#1e3a5f] pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-emerald-400">
              Grade Scales
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2">
              Manage the grading systems used to calculate GPA.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Scale
          </Button>
        </div>

        {/* System Scales */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-slate-500">
            System Scales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {systemScales.map((scale) => (
              <div key={scale.id} className="bg-[#273449] border border-[#1e3a5f] rounded-sm p-5 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-500/50"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-200">{scale.label}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-1">{scale.grades.length} grades defined</p>
                  </div>
                  <div className="bg-slate-500/10 text-slate-400 px-2 py-1 rounded-sm flex items-center text-[10px] font-mono tracking-widest uppercase">
                    <Shield className="w-3 h-3 mr-1" /> System
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Scales */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-slate-500">
            Your Custom Scales
          </h2>
          {userScales.length === 0 ? (
            <div className="bg-[#273449] border border-[#1e3a5f] border-dashed rounded-sm p-8 text-center">
              <p className="text-slate-400 font-mono text-sm">No custom scales created yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userScales.map((scale) => (
                <div key={scale.id} className="bg-[#273449] border border-[#1e3a5f] rounded-sm p-5 relative group transition-all hover:border-emerald-400/50">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400/50"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-mono text-sm font-bold text-slate-200">{scale.label}</h3>
                      <p className="text-xs font-mono text-slate-500 mt-1">{scale.grades.length} grades defined</p>
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(scale)}
                        className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(scale.id)}
                        className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <GradeScaleEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialData={editingScale}
        onSave={handleSave}
      />
    </div>
  )
}
