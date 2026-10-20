import { useState } from 'react'
import { 
  Plus, Edit2, Trash2, Shield, Loader2,
  User, Database, Download, Copy, LogOut, Check,
  ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
import { useGradeScales } from '@/hooks/useGradeScales'
import type { GradeScale } from '@/lib/queries/gradeScales'
import { GradeScaleEditor } from '@/components/settings/GradeScaleEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BAND_TEXT_CLASS, cardAccentClass } from '@/components/ruler/tone'
import { useAuth } from '@/context/AuthContext'
import { useDegrees } from '@/hooks/useDegrees'
import { supabase } from '@/lib/supabase'
import { getProfile, updateDisplayName } from '@/lib/queries/profiles'
import { parseBackup } from '@/lib/backup'
import { createDegree } from '@/lib/queries/degrees'
import { createGradeScale } from '@/lib/queries/gradeScales'
import { saveSemester } from '@/lib/queries/semesters'
import { queryClient } from '@/lib/queryClient'

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
      toast.success('Scale deleted')
    } catch (err: any) {
      toast.error(friendlyError(err, "Couldn't delete the scale. Try again."))
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

      toast.success('Degree data exported')
    } catch (err: any) {
      toast.error(friendlyError(err, "Couldn't export your degrees. Try again."))
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
      toast.error(friendlyError(err, "Couldn't import that file. Try again."))
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
    <div className="min-h-screen bg-background pb-32 text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">Settings</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Manage your grading systems and account preferences.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus />
            New scale
          </Button>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold">Your custom scales</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Custom grading systems for your university or special programs.
          </p>

          {userScales.length === 0 ? (
            <div className="mt-4 rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
              <h3 className="font-display text-2xl font-semibold tracking-tight">No custom scales yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Built-in scales are used by default. Create a custom scale if your university uses its own point values.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {userScales.map((scale, index) => (
                <article key={scale.id} className="flex h-full flex-col overflow-hidden rounded-[22px] bg-card">
                  <div className={`h-[3px] shrink-0 ${cardAccentClass(index)}`} aria-hidden="true" />
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-semibold">{scale.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{scale.grades.length} grades</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {scale.grades.slice(0, 6).map((grade, gradeIndex) => (
                        <span key={gradeIndex} className="rounded-full bg-background px-2.5 py-1 text-xs">
                          {grade.grade} <span className="text-muted-foreground">{grade.points}</span>
                        </span>
                      ))}
                      {scale.grades.length > 6 && (
                        <span className="self-center text-xs text-muted-foreground">+{scale.grades.length - 6} more</span>
                      )}
                    </div>
                    <div className="mt-auto flex gap-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(scale)}>
                        <Edit2 /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(scale.id)} className="text-destructive">
                        <Trash2 /> Delete
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <section className="mt-6 overflow-hidden rounded-[22px] bg-card">
          <div className={`h-[3px] ${cardAccentClass(0)}`} aria-hidden="true" />
          <button
            onClick={() => setShowSystemScales(!showSystemScales)}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <Shield className={`size-5 ${BAND_TEXT_CLASS.pass}`} />
              <div>
                <h2 className="font-semibold">Built-in scales ({systemScales.length})</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Standard grading systems, including the 4.0 scale and Sri Lankan UGC.
                </p>
              </div>
            </div>
            {showSystemScales ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
          </button>

          {showSystemScales && (
            <div className="grid gap-4 border-t border-border px-5 py-5 sm:grid-cols-2">
              {systemScales.map((scale, index) => (
                <article key={scale.id} className="flex h-full flex-col overflow-hidden rounded-[22px] bg-background">
                  <div className={`h-[3px] ${cardAccentClass(index)}`} aria-hidden="true" />
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-semibold">{scale.label}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{scale.grades.length} letter grades</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {scale.grades.slice(0, 6).map((grade, gradeIndex) => (
                        <span key={gradeIndex} className="rounded-full bg-card px-2.5 py-1 text-xs">
                          {grade.grade} <span className="text-muted-foreground">{grade.points}</span>
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      <Button variant="outline" size="sm" onClick={() => handleView(scale)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCloneScale(scale)}>
                        <Copy /> Clone and edit
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4 overflow-hidden rounded-[22px] bg-card">
          <div className={`h-[3px] ${cardAccentClass(1)}`} aria-hidden="true" />
          <button
            onClick={() => {
              const next = !showAccountDetails
              setShowAccountDetails(next)
              if (next) {
                getProfile().then((profile) => setDisplayName(profile?.display_name || '')).catch(() => {})
              }
            }}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <User className={`size-5 ${BAND_TEXT_CLASS['second-lower']}`} />
              <div>
                <h2 className="font-semibold">Account</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Signed in as <span className="text-foreground">{session?.user?.email}</span>
                </p>
              </div>
            </div>
            {showAccountDetails ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
          </button>

          {showAccountDetails && (
            <div className="max-w-xl space-y-5 border-t border-border px-5 py-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{session?.user?.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Degrees</dt>
                  <dd className="tabular-nums">{degrees.length}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className={`flex items-center gap-1 ${BAND_TEXT_CLASS.pass}`}>
                    <Check className="size-3.5" /> Signed in
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <label htmlFor="display-name" className="text-sm text-muted-foreground">Display name</label>
                <div className="flex gap-2">
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-xl"
                  />
                  <Button
                    disabled={savingName || !displayName.trim()}
                    onClick={async () => {
                      setSavingName(true)
                      try {
                        await updateDisplayName(displayName)
                        toast.success('Display name saved')
                      } catch (err: any) {
                        toast.error(friendlyError(err, "Couldn't save your name. Try again."))
                      } finally {
                        setSavingName(false)
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>

              <Button variant="destructive" onClick={() => signOut()} className="w-full sm:w-auto">
                <LogOut /> Sign out
              </Button>
            </div>
          )}
        </section>

        <section className="mt-4 overflow-hidden rounded-[22px] bg-card">
          <div className={`h-[3px] ${cardAccentClass(2)}`} aria-hidden="true" />
          <button
            onClick={() => setShowDataBackup(!showDataBackup)}
            className="flex w-full items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <Database className={`size-5 ${BAND_TEXT_CLASS['second-upper']}`} />
              <div>
                <h2 className="font-semibold">Backup</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Export a JSON backup and clear the guest calculator draft.
                </p>
              </div>
            </div>
            {showDataBackup ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
          </button>

          {showDataBackup && (
            <div className="grid gap-4 border-t border-border px-5 py-5 sm:grid-cols-2">
              <div className="flex flex-col justify-between gap-4 rounded-[22px] bg-background p-4">
                <div>
                  <h3 className="font-semibold">Export your degrees</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Download a JSON backup of your degrees, semesters, and custom scales.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleExportData} disabled={isExporting}>
                    {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
                    Download backup
                  </Button>
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="application/json"
                      className="sr-only"
                      disabled={isImporting}
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) handleImportData(file)
                      }}
                    />
                    <span className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full border border-foreground/20 px-4 text-sm">
                      {isImporting ? 'Importing…' : 'Import backup'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-4 rounded-[22px] bg-background p-4">
                <div>
                  <h3 className="font-semibold">Guest draft</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Clear the calculator draft stored in this browser.
                  </p>
                </div>
                <Button onClick={handleClearGuestDraft} variant="outline" className="w-fit">
                  Clear draft
                </Button>
              </div>
            </div>
          )}
        </section>

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
