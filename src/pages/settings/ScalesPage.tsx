import { useState } from 'react'
import { 
  Plus, Edit2, Trash2, Shield, Loader2, Monitor, Sun, Moon, 
  Sliders, User, Database, Download, Copy, LogOut, Check, Sparkles,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { useGradeScales } from '@/hooks/useGradeScales'
import type { GradeScale } from '@/lib/queries/gradeScales'
import { GradeScaleEditor } from '@/components/settings/GradeScaleEditor'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/context/AuthContext'
import { useDegrees } from '@/hooks/useDegrees'
import { supabase } from '@/lib/supabase'
import { getProfile, updateDisplayName } from '@/lib/queries/profiles'
import { parseBackup } from '@/lib/backup'
import { createDegree } from '@/lib/queries/degrees'
import { createGradeScale } from '@/lib/queries/gradeScales'
import { saveSemester } from '@/lib/queries/semesters'
import { queryClient } from '@/lib/queryClient'

function ThemeChoiceButton({ value, label }: { value: "light" | "dark" | "system", label: string }) {
  const { theme, setTheme } = useTheme()
  const isActive = theme === value
  
  return (
    <button
      onClick={() => setTheme(value)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-widest transition-all ${
        isActive 
          ? 'bg-background text-foreground shadow-xs border border-border' 
          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
      }`}
    >
      {value === 'light' && <Sun className="w-3.5 h-3.5 text-amber-500" />}
      {value === 'dark' && <Moon className="w-3.5 h-3.5 text-sky-400" />}
      {value === 'system' && <Monitor className="w-3.5 h-3.5 text-emerald-400" />}
      {label}
    </button>
  )
}

export default function ScalesPage() {
  const { scales, isLoading, createScale, updateScale, deleteScale } = useGradeScales()
  const { session, signOut } = useAuth()
  const { degrees } = useDegrees()

  // Modal State
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingScale, setEditingScale] = useState<GradeScale | undefined>()
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Abstracted / Collapsible Card States
  const [showSystemScales, setShowSystemScales] = useState(false)
  const [showAccountDetails, setShowAccountDetails] = useState(false)
  const [showDataBackup, setShowDataBackup] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)

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

  const handleCloneScale = (scale: GradeScale) => {
    setEditingScale({
      ...scale,
      id: '',
      label: `${scale.label} (Copy)`
    })
    setIsReadOnly(false)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scale? Any degrees using it will lose their scale association.')) return
    try {
      await deleteScale(id)
      toast.success('Scale deleted successfully')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSave = async (label: string, grades: any[]) => {
    if (editingScale && editingScale.id) {
      await updateScale({ id: editingScale.id, label, grades })
      toast.success('Scale updated')
    } else {
      await createScale({ label, grades })
      toast.success('New scale created')
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData?.user) throw new Error("Not authenticated")

      const { data: userDegrees, error: degErr } = await supabase
        .from('degrees')
        .select(`*, semesters(*, modules(*))`)
        .eq('user_id', authData.user.id)

      if (degErr) throw degErr

      const backupData = {
        exportedAt: new Date().toISOString(),
        userEmail: authData.user.email,
        degreesCount: userDegrees?.length || 0,
        customScales: userScales,
        degrees: userDegrees || []
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `semest-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Degree data exported successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to export backup data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (file: File) => {
    setIsImporting(true)
    try {
      const backup = parseBackup(JSON.parse(await file.text()))
      const scaleIds = new Map<string, string>()
      for (const scale of backup.customScales) {
        if (scale.is_system) continue
        const created = await createGradeScale(`${scale.label} (imported)`, scale.grades)
        if (scale.id) scaleIds.set(scale.id, created.id)
      }
      for (const degree of backup.degrees) {
        if (!degree?.title) continue
        const mappedScale = degree.grade_scale_id ? scaleIds.get(degree.grade_scale_id) : null
        const keptSystemScale = scales.some((scale) => scale.is_system && scale.id === degree.grade_scale_id)
          ? degree.grade_scale_id
          : null
        const created = await createDegree({
          title: `${degree.title} (imported)`,
          institution: degree.institution || null,
          started_year: degree.started_year || null,
          grade_scale_id: mappedScale || keptSystemScale || null,
        })
        for (const semester of degree.semesters || []) {
          await saveSemester(
            created.id,
            semester.title || 'Semester',
            (semester.modules || []).filter((mod) => Number(mod.credits) > 0).map((mod) => ({
              id: crypto.randomUUID(),
              name: mod.name || 'Untitled Module',
              credits: Number(mod.credits),
              grade: mod.grade || 'Not graded',
            })),
            semester.term || null,
            semester.sem_index,
          )
        }
      }
      await queryClient.invalidateQueries()
      toast.success('Backup imported as new degrees')
    } catch (err: any) {
      toast.error(err.message || 'Could not import that file')
    } finally {
      setIsImporting(false)
    }
  }

  const handleClearGuestDraft = () => {
    sessionStorage.removeItem('semest_guest_draft')
    toast.success('Guest draft cache cleared')
  }

  if (isLoading) {
    return (
      <div role="status" className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-widest uppercase text-primary flex items-center gap-3">
              <Sliders className="w-7 h-7" /> Settings
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-2">
              Manage your grading systems, theme, and account preferences.
            </p>
          </div>
        </div>

        {/* 1. APPEARANCE SETTINGS (Compact & Clean) */}
        <Card className="p-5 bg-card border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                Appearance
              </h3>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">Select your preferred color theme.</p>
            </div>
            <div className="flex items-center bg-muted rounded p-1">
              <ThemeChoiceButton value="light" label="Light" />
              <ThemeChoiceButton value="dark" label="Dark" />
              <ThemeChoiceButton value="system" label="System" />
            </div>
          </div>
        </Card>

        {/* 2. CUSTOM GRADE SCALES (Primary Focus) */}
        <div className="space-y-4">
          <div className="flex justify-between items-end border-b pb-3">
            <div>
              <h2 className="text-base font-mono font-bold tracking-widest uppercase text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Your Custom Scales
              </h2>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Custom grading systems for your university or special programs.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded font-mono text-xs uppercase tracking-widest"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Scale
            </Button>
          </div>

          {userScales.length === 0 ? (
            <div className="bg-card border border-border border-dashed rounded-lg p-8 text-center space-y-3">
              <Sliders className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-sm font-mono font-bold text-foreground">No custom scales created yet</h3>
              <p className="text-muted-foreground font-mono text-xs max-w-md mx-auto">
                System grade scales (Standard 4.0, Sri Lankan UGC) are used by default. Create a custom scale if your university uses unique point values.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {userScales.map((scale) => (
                <Card key={scale.id} className="p-5 bg-card border-border relative flex flex-col justify-between group hover:border-primary/50 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-mono text-sm font-bold text-foreground group-hover:text-primary transition-colors">{scale.label}</h3>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{scale.grades.length} grades defined</p>
                      </div>
                      <div className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                        Custom
                      </div>
                    </div>

                    {/* Grade Preview Chips */}
                    <div className="flex flex-wrap gap-1.5 my-3">
                      {scale.grades.slice(0, 6).map((g, idx) => (
                        <span key={idx} className="bg-muted/80 text-foreground border border-border px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                          {g.grade} <span className="text-muted-foreground text-[9px]">({g.points})</span>
                        </span>
                      ))}
                      {scale.grades.length > 6 && (
                        <span className="text-xs font-mono text-muted-foreground self-center">+{scale.grades.length - 6} more</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 border-t pt-3 mt-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(scale)}
                      className="font-mono text-xs text-foreground hover:text-primary h-8"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(scale.id)}
                      className="font-mono text-xs text-destructive hover:bg-destructive/10 h-8"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 3. SYSTEM GRADE SCALES (Abstracted / Collapsible) */}
        <Card className="bg-card border-border overflow-hidden">
          <button 
            onClick={() => setShowSystemScales(!showSystemScales)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded text-muted-foreground">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">
                  Built-In System Scales ({systemScales.length})
                </h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Standard grading systems provided by default (Standard 4.0, Sri Lankan UGC...)
                </p>
              </div>
            </div>
            {showSystemScales ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showSystemScales && (
            <div className="p-5 border-t border-border bg-muted/10 space-y-4 animate-fadeIn">
              <div className="grid gap-4 sm:grid-cols-2">
                {systemScales.map((scale) => (
                  <Card key={scale.id} className="p-4 bg-card border-border flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-mono text-sm font-bold text-foreground">{scale.label}</h4>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">{scale.grades.length} letter grades</p>
                        </div>
                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest">
                          System
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 my-3">
                        {scale.grades.slice(0, 6).map((g, idx) => (
                          <span key={idx} className="bg-muted/80 text-foreground border border-border px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                            {g.grade} <span className="text-muted-foreground text-[9px]">({g.points})</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t pt-3 mt-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleView(scale)}
                        className="flex-1 font-mono text-xs text-foreground hover:text-primary h-8"
                      >
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCloneScale(scale)}
                        className="font-mono text-xs text-foreground hover:text-primary h-8"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Clone & Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 4. ACCOUNT & SECURITY (Abstracted / Collapsible) */}
        <Card className="bg-card border-border overflow-hidden">
          <button 
            onClick={() => {
              const next = !showAccountDetails
              setShowAccountDetails(next)
              if (next) {
                getProfile().then((profile) => setDisplayName(profile?.display_name || '')).catch(() => {})
              }
            }}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded text-muted-foreground">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">
                  Account & Profile
                </h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Signed in as <span className="text-foreground font-bold">{session?.user?.email}</span>
                </p>
              </div>
            </div>
            {showAccountDetails ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showAccountDetails && (
            <div className="p-5 border-t border-border bg-muted/10 space-y-4 animate-fadeIn max-w-xl">
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">User Email</span>
                  <span className="text-foreground font-bold">{session?.user?.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Active Degrees</span>
                  <span className="text-primary font-bold">{degrees.length} Managed Degrees</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Authenticated
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Display name</label>
                <div className="flex gap-2">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="flex-1 h-10 rounded-md border border-border bg-background px-3 font-mono text-sm"
                  />
                  <Button
                    disabled={savingName || !displayName.trim()}
                    onClick={async () => {
                      setSavingName(true)
                      try {
                        await updateDisplayName(displayName)
                        toast.success('Display name saved')
                      } catch (err: any) {
                        toast.error(err.message)
                      } finally {
                        setSavingName(false)
                      }
                    }}
                    className="font-mono text-xs uppercase tracking-widest"
                  >
                    Save
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => signOut()}
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 font-mono text-xs uppercase tracking-widest h-10"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* 5. DATA BACKUP & MAINTENANCE (Abstracted / Collapsible) */}
        <Card className="bg-card border-border overflow-hidden">
          <button 
            onClick={() => setShowDataBackup(!showDataBackup)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded text-muted-foreground">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-mono text-sm font-bold text-foreground uppercase tracking-wider">
                  Data Backup & Maintenance
                </h3>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  Export JSON degree backups and manage local guest session memory.
                </p>
              </div>
            </div>
            {showDataBackup ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>

          {showDataBackup && (
            <div className="p-5 border-t border-border bg-muted/10 grid gap-4 sm:grid-cols-2 animate-fadeIn">
              <div className="p-4 bg-card border border-border rounded space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-foreground">Export Degree Data</h4>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    Download a JSON backup of all your degrees, semesters, and custom scales.
                  </p>
                </div>
                <Button 
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold text-xs uppercase tracking-widest h-9 w-full"
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
                  Download Backup
                </Button>
                <label className="block">
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    disabled={isImporting}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      event.target.value = ''
                      if (file) handleImportData(file)
                    }}
                  />
                  <span className="inline-flex w-full h-9 items-center justify-center rounded-md border border-border font-mono text-xs uppercase tracking-widest cursor-pointer">
                    {isImporting ? 'Importing…' : 'Import backup'}
                  </span>
                </label>
              </div>

              <div className="p-4 bg-card border border-border rounded space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-mono text-sm font-bold text-foreground">Reset Guest Cache</h4>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    Clear temporary guest calculator drafts stored in browser memory.
                  </p>
                </div>
                <Button 
                  onClick={handleClearGuestDraft}
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-mono font-bold text-xs uppercase tracking-widest h-9 w-full"
                >
                  Clear Draft Cache
                </Button>
              </div>
            </div>
          )}
        </Card>

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
