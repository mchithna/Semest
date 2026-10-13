import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookTemplate, Loader2, ArrowLeft, Share2, Check, ExternalLink, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeletePreset, useMyPresets, useSyncPreset, useUpdatePreset } from '@/hooks/usePresets'
import { useDegrees } from '@/hooks/useDegrees'
import { toast } from 'sonner'

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
    toast.success(`Share link for preset ${code} copied to clipboard!`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-slideUp">
        
        <div className="flex items-center gap-4 text-primary mb-6">
          <Button variant="ghost" className="p-0 hover:bg-transparent text-primary hover:text-primary/80" onClick={() => navigate('/presets')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Presets
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-primary">
              My Published Presets
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-2">
              Manage the degree presets you have shared with the community.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/presets/new')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            Publish New Preset
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 bg-muted rounded-xl" />
            ))}
          </div>
        ) : !presets || presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-card/30">
            <BookTemplate className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-mono font-bold text-foreground mb-2">No presets published</h3>
            <p className="text-muted-foreground font-mono text-sm max-w-md">
              You haven't published any of your degrees as presets yet. Share your degree structure with others!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {presets.map((preset) => (
              <Card 
                key={preset.id} 
                className="bg-card border-border p-6 hover:border-primary/50 transition-colors flex flex-col hover:-translate-y-1 hover:shadow-xl cursor-pointer group"
                onClick={() => navigate(`/presets/${preset.code}`)}
              >
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-mono font-bold text-foreground group-hover:text-primary transition-colors">{preset.title}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{preset.institution || 'No Institution specified'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded font-mono text-xs font-bold">
                      {preset.code}
                    </div>
                  </div>
                </div>
                
                {preset.description && (
                  <p className="text-sm font-mono text-muted-foreground mb-6 line-clamp-2 flex-1">
                    {preset.description}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-4 border-t pt-4">
                  <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                    <span className={`px-2 py-0.5 rounded font-bold ${preset.is_public ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                      {preset.is_public ? 'Public' : 'Private'}
                    </span>
                    <span>{preset.use_count} clones</span>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSyncPresetId(preset.id)
                      }}
                      className="flex-1 border-border text-foreground hover:text-primary hover:border-primary transition-colors text-xs font-mono"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Sync
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditPresetId(preset.id)
                        setEditTitle(preset.title)
                        setEditDescription(preset.description || '')
                        setEditInstitution(preset.institution || '')
                        setEditPublic(preset.is_public)
                      }}
                      className="border-border text-foreground hover:text-primary hover:border-primary transition-colors text-xs font-mono px-3"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>

                    {preset.is_public && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleShareLink(e, preset.code)}
                        className="border-border text-foreground hover:text-primary hover:border-primary transition-colors text-xs font-mono px-3"
                        title="Share Preset Link"
                      >
                        {copiedCode === preset.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Share
                      </Button>
                    )}

                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/presets/${preset.code}`)
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors text-xs font-mono px-2"
                      title="View Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sync Preset Modal */}
      {syncPresetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-2xl space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-mono font-bold text-foreground mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary" /> Sync Preset
              </h2>
              <p className="text-sm font-mono text-muted-foreground">
                Which of your current degrees should update this preset's structure?
              </p>
            </div>

            <select 
              value={syncDegreeId}
              onChange={e => setSyncDegreeId(e.target.value)}
              className="bg-background border border-border rounded-md px-3 text-foreground font-mono h-10 w-full focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select a degree --</option>
              {degrees.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md">
              <p className="text-xs font-mono text-amber-400/90 leading-relaxed">
                ⚠ This will replace the current semester & module structure in the preset with your latest degree updates. Your share code and clone count will be preserved.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setSyncPresetId(null)
                  setSyncDegreeId('')
                }}
                className="text-muted-foreground hover:text-foreground font-mono"
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
                        toast.success('Preset updated and synced successfully!')
                        setSyncPresetId(null)
                        setSyncDegreeId('')
                      },
                      onError: (err: any) => {
                        toast.error(err.message || 'Failed to sync preset')
                      }
                    }
                  )
                }}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono"
              >
                {syncPreset.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sync Preset
              </Button>
            </div>
          </div>
        </div>
      )}

      {editPresetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-mono font-bold text-foreground">Edit preset</h2>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" className="font-mono" />
            <Input value={editInstitution} onChange={(e) => setEditInstitution(e.target.value)} placeholder="Institution" className="font-mono" />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Description"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono min-h-[80px]"
            />
            <label className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
              <input type="checkbox" checked={editPublic} onChange={(e) => setEditPublic(e.target.checked)} className="accent-primary" />
              Public
            </label>
            <div className="flex justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                className="text-destructive font-mono"
                disabled={deletePreset.isPending}
                onClick={() => {
                  if (!confirm('Delete this preset? The share code will stop working.')) return
                  deletePreset.mutate(editPresetId, {
                    onSuccess: () => {
                      toast.success('Preset deleted')
                      setEditPresetId(null)
                    },
                    onError: (err: any) => toast.error(err.message || 'Failed to delete preset'),
                  })
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" className="font-mono" onClick={() => setEditPresetId(null)}>Cancel</Button>
                <Button
                  className="font-mono"
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
                        onError: (err: any) => toast.error(err.message || 'Failed to update preset'),
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
