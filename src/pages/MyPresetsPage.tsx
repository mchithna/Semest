import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BookTemplate, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMyPresets, useSyncPreset } from '@/hooks/usePresets'
import { useDegrees } from '@/hooks/useDegrees'
import { toast } from 'sonner'

export default function MyPresetsPage() {
  const navigate = useNavigate()
  const { data: presets, isLoading } = useMyPresets()
  const { degrees } = useDegrees()
  const syncPreset = useSyncPreset()

  const [syncPresetId, setSyncPresetId] = useState<string | null>(null)
  const [syncDegreeId, setSyncDegreeId] = useState<string>('')

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
              <Card key={preset.id} className="bg-card border-border p-6 hover:border-primary/50 transition-colors flex flex-col hover:-translate-y-1 hover:shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-mono font-bold text-foreground">{preset.title}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{preset.institution || 'No Institution'}</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-3 py-1 rounded font-mono text-xs font-bold">
                    {preset.code}
                  </div>
                </div>
                
                {preset.description && (
                  <p className="text-sm font-mono text-muted-foreground mb-6 line-clamp-2 flex-1">
                    {preset.description}
                  </p>
                )}

                <div className="mt-auto flex flex-col gap-4 border-t pt-4">
                  <div className="flex justify-between items-center text-xs font-mono text-muted-foreground">
                    <span className={preset.is_public ? 'text-primary' : 'text-muted-foreground'}>
                      {preset.is_public ? 'Public' : 'Private'}
                    </span>
                    <span>{preset.use_count} uses</span>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => setSyncPresetId(preset.id)}
                    className="w-full border-border text-foreground hover:text-primary hover:border-primary transition-colors"
                  >
                    Sync from degree
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {syncPresetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-mono font-bold text-foreground mb-2">Sync Preset</h2>
              <p className="text-sm font-mono text-muted-foreground">
                Which of your degrees should update this preset?
              </p>
            </div>

            <select 
              value={syncDegreeId}
              onChange={e => setSyncDegreeId(e.target.value)}
              className="bg-background border border-border rounded-md px-3 text-foreground font-mono h-10 w-full focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select a degree --</option>
              {degrees.map(d => (
                <option key={d.id} value={d.id}>{d.title}</option>
              ))}
            </select>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md">
              <p className="text-xs font-mono text-amber-400/90 leading-relaxed">
                ⚠ This will replace the current module list in the preset. Your share code and clone count are preserved.
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
                        toast.success('Preset synced successfully!')
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
                Sync
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
