import { useState } from 'react'
import { Plus, Edit2, Trash2, Shield, Loader2, Monitor, Sun, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { useGradeScales } from '@/hooks/useGradeScales'
import type { GradeScale } from '@/lib/queries/gradeScales'
import { GradeScaleEditor } from '@/components/settings/GradeScaleEditor'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

function ThemeChoiceButton({ value, label }: { value: "light" | "dark" | "system", label: string }) {
  const { theme, setTheme } = useTheme()
  const isActive = theme === value
  
  return (
    <button
      onClick={() => setTheme(value)}
      className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-mono font-bold uppercase tracking-widest transition-all ${
        isActive 
          ? 'bg-background text-foreground shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
      }`}
    >
      {value === 'light' && <Sun className="w-3 h-3" />}
      {value === 'dark' && <Moon className="w-3 h-3" />}
      {value === 'system' && <Monitor className="w-3 h-3" />}
      {label}
    </button>
  )
}

export default function ScalesPage() {
  const { scales, isLoading, createScale, updateScale, deleteScale } = useGradeScales()
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingScale, setEditingScale] = useState<GradeScale | undefined>()
  const [isReadOnly, setIsReadOnly] = useState(false)

  const systemScales = scales.filter(s => s.is_system)
  const userScales = scales.filter(s => !s.is_system)

  const handleCreate = () => {
    setEditingScale(undefined)
    setIsReadOnly(false)
    setEditorOpen(true)
  }

  const handleEdit = (scale: GradeScale) => {
    setEditingScale(scale)
    setIsReadOnly(false)
    setEditorOpen(true)
  }

  const handleView = (scale: GradeScale) => {
    setEditingScale(scale)
    setIsReadOnly(true)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-primary">
              Grade Scales
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-2">
              Manage the grading systems used to calculate GPA.
            </p>
          </div>
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Scale
          </Button>
        </div>

        {/* Appearance Settings */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground">
            Appearance
          </h2>
          <div className="bg-card border border-border rounded-sm p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-mono text-sm font-bold text-foreground">Theme Preference</h3>
                <p className="text-xs font-mono text-muted-foreground mt-1">Select your preferred color theme.</p>
              </div>
              <div className="flex items-center bg-muted rounded-sm p-1">
                <ThemeChoiceButton value="light" label="Light" />
                <ThemeChoiceButton value="dark" label="Dark" />
                <ThemeChoiceButton value="system" label="System" />
              </div>
            </div>
          </div>
        </div>

        {/* System Scales */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground">
            System Scales
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {systemScales.map((scale) => (
              <div 
                key={scale.id} 
                onClick={() => handleView(scale)}
                className="bg-card border border-border rounded-sm p-5 relative overflow-hidden group cursor-pointer hover:border-muted-foreground/50 transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-muted group-hover:bg-muted-foreground transition-colors"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-mono text-sm font-bold text-foreground">{scale.label}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-1">{scale.grades.length} grades defined</p>
                  </div>
                  <div className="bg-muted text-muted-foreground px-2 py-1 rounded-sm flex items-center text-[10px] font-mono tracking-widest uppercase">
                    <Shield className="w-3 h-3 mr-1" /> System
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Scales */}
        <div className="space-y-4">
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-muted-foreground">
            Your Custom Scales
          </h2>
          {userScales.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-sm p-8 text-center">
              <p className="text-muted-foreground font-mono text-sm">No custom scales created yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userScales.map((scale) => (
                <div key={scale.id} className="bg-card border border-border rounded-sm p-5 relative group transition-all hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/50 group-hover:bg-primary transition-colors"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-mono text-sm font-bold text-foreground group-hover:text-primary transition-colors">{scale.label}</h3>
                      <p className="text-xs font-mono text-muted-foreground mt-1">{scale.grades.length} grades defined</p>
                    </div>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(scale)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(scale.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
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
        isReadOnly={isReadOnly}
      />
    </div>
  )
}
