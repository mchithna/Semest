import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Share2, Check, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cardAccentClass } from '@/components/ruler/tone'
import { useDeletePreset, useMyPresets, useSyncPreset, useUpdatePreset } from '@/hooks/usePresets'
import { useDegrees } from '@/hooks/useDegrees'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'

export default function MyPresetsPage() {
  const navigate = useNavigate()
  const { data: presets, isLoading } = useMyPresets()
  const { degrees } = useDegrees()
  const syncPreset = useSyncPreset()
  const updatePreset = useUpdatePreset()
  const deletePreset = useDeletePreset()

  const [syncPresetId, setSyncPresetId] = useState<string | null>(null)
  const [editPresetId, setEditPresetId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editInstitution, setEditInstitution] = useState('')
  const [editPublic, setEditPublic] = useState(true)
  const [syncDegreeId, setSyncDegreeId] = useState<string>('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleShareLink = (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    const url = `${window.location.origin}/presets/${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success('Share link copied')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>My presets · Semest</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Button variant="ghost" className="mb-4 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => navigate('/presets')}>
          Back to presets
        </Button>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">My presets</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Manage the degree presets you have shared.
            </p>
          </div>
          <Button onClick={() => navigate('/presets/new')}>Publish preset</Button>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-[22px] bg-muted" />
            ))}
          </div>
        ) : !presets || presets.length === 0 ? (
          <div className="mt-10 rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight">No presets published</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Publish a degree when you want other people to clone its structure.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => navigate('/presets/new')}>
              Publish preset
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {presets.map((preset, index) => (
              <article key={preset.id} className="flex h-full flex-col overflow-hidden rounded-[22px] bg-card">
                <div className={`h-[3px] shrink-0 ${cardAccentClass(index)}`} aria-hidden="true" />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold">{preset.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {preset.institution?.trim() || 'Unknown institution'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-background px-2.5 py-1 text-xs tracking-wide">
                      {preset.code}
                    </span>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {preset.is_public ? 'Public' : 'Private'} · {preset.use_count} {preset.use_count === 1 ? 'clone' : 'clones'}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSyncPresetId(preset.id)}
                    >
                      <RefreshCw />
                      Sync
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditPresetId(preset.id)
                        setEditTitle(preset.title)
                        setEditDescription(preset.description || '')
                        setEditInstitution(preset.institution || '')
                        setEditPublic(preset.is_public)
                      }}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    {preset.is_public && (
                      <Button variant="outline" size="sm" onClick={(event) => handleShareLink(event, preset.code)}>
                        {copiedCode === preset.code ? <Check /> : <Share2 />}
                        Share
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/presets/${preset.code}`)}>
                      Open
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Sync Preset Modal */}
      {syncPresetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-6 rounded-[22px] bg-card p-6 shadow-2xl">
            <div>
              <h2 className="mb-2 font-display text-2xl font-semibold">Sync preset</h2>
              <p className="text-sm text-muted-foreground">
                Which of your current degrees should update this preset's structure?
              </p>
            </div>

            <select 
              value={syncDegreeId}
              onChange={e => setSyncDegreeId(e.target.value)}
              className="h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm text-foreground focus:outline-hidden focus:ring-3 focus:ring-ring/50"
            >
              <option value="">-- Select a degree --</option>
              {degrees.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>

            <p className="rounded-xl border border-foreground/15 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              This replaces the preset’s semesters and modules with the degree you choose. The share code and clone count stay.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSyncPresetId(null)
                  setSyncDegreeId('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button 
                disabled={!syncDegreeId || syncPreset.isPending}
                onClick={() => {
                  if (!syncDegreeId) return
                  syncPreset.mutate(
                    { presetId: syncPresetId, degreeId: syncDegreeId },
                    {
                      onSuccess: () => {
                        toast.success('Preset updated')
                        setSyncPresetId(null)
                        setSyncDegreeId('')
                      },
                      onError: (err: any) => {
                        toast.error(friendlyError(err, "Couldn't update the preset. Try again."))
                      }
                    }
                  )
                }}
                className=""
              >
                {syncPreset.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sync preset
              </Button>
            </div>
          </div>
        </div>
      )}

      {editPresetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-[22px] bg-card p-6 shadow-2xl">
            <h2 className="font-display text-2xl font-semibold">Edit preset</h2>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" className="rounded-xl" />
            <Input value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} placeholder="Institution" className="rounded-xl" />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              className="min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} className="accent-primary" />
              Public
            </label>
            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                className="text-destructive"
                disabled={deletePreset.isPending}
                onClick={() => {
                  if (!confirm('Delete this preset? The share code will stop working.')) return
                  deletePreset.mutate(editPresetId, {
                    onSuccess: () => {
                      toast.success('Preset deleted')
                      setEditPresetId(null)
                    },
                    onError: (err: unknown) => toast.error(friendlyError(err, "Couldn't delete the preset. Try again.")),
                  })
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="" onClick={() => setEditPresetId(null)}>Cancel</Button>
                <Button
                  className=""
                  disabled={!editTitle.trim() || updatePreset.isPending}
                  onClick={() => {
                    updatePreset.mutate(
                      {
                        presetId: editPresetId,
                        title: editTitle.trim(),
                        description: editDescription,
                        institution: editInstitution,
                        isPublic: editPublic,
                      },
                      {
                        onSuccess: () => {
                          toast.success('Preset updated')
                          setEditPresetId(null)
                        },
                        onError: (err: unknown) => toast.error(friendlyError(err, "Couldn't update the preset. Try again.")),
                      }
                    )
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
