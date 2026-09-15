import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Copy, FileText, Check, GraduationCap, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { usePreset, useApplyPreset } from '@/hooks/usePresets'
import { useDegrees } from '@/hooks/useDegrees'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

export default function PresetDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { data: preset, isLoading, isError } = usePreset(code || '')
  const applyPreset = useApplyPreset()
  const { degrees } = useDegrees()

  const [isCopied, setIsCopied] = useState(false)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [degreeTitle, setDegreeTitle] = useState('')
  const [cloneMode, setCloneMode] = useState<'new' | 'existing'>('new')
  const [targetDegreeId, setTargetDegreeId] = useState<string>('')

  const handleCopyCode = () => {
    if (!preset) return
    navigator.clipboard.writeText(preset.code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success("Share code copied to clipboard!")
  }

  const handleCopyLink = () => {
    if (!preset) return
    const url = `${window.location.origin}/presets/${preset.code}`
    navigator.clipboard.writeText(url)
    setIsLinkCopied(true)
    setTimeout(() => setIsLinkCopied(false), 2000)
    toast.success("Preset share link copied to clipboard!")
  }

  const handleClone = () => {
    if (!preset) return

    if (cloneMode === 'existing' && !targetDegreeId) {
      toast.error('Please select a degree to append to.')
      return
    }

    applyPreset.mutate(
      { 
        presetCode: preset.code, 
        targetDegreeId: cloneMode === 'existing' ? targetDegreeId : undefined,
        degreeTitle: cloneMode === 'new' ? (degreeTitle.trim() || preset.title) : undefined 
      },
      {
        onSuccess: (newDegreeId) => {
          toast.success("Preset successfully cloned!")
          if (preset.scale_snapshot && (!preset.grade_scale_id || (preset.grade_scale && !preset.grade_scale.is_system))) {
             toast.success(`Grade scale copied to your account!`)
          }
          navigate(`/degrees/${newDegreeId}/semesters`)
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to clone preset.")
        }
      }
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          <Skeleton className="h-10 w-40 bg-muted" />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
            <div className="flex-1 space-y-4 w-full">
              <Skeleton className="h-10 w-3/4 bg-muted" />
              <Skeleton className="h-5 w-1/2 bg-muted" />
              <Skeleton className="h-24 w-full bg-muted" />
            </div>
            <Skeleton className="h-12 w-48 bg-muted" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full bg-muted" />
            <Skeleton className="h-40 w-full bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !preset) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center text-foreground">
        <FileText className="w-16 h-16 text-destructive mb-6 opacity-50" />
        <h2 className="text-2xl font-mono font-bold tracking-widest uppercase mb-2">Preset Not Found</h2>
        <p className="text-muted-foreground font-mono text-sm mb-8 max-w-md">
          The share code you entered might be invalid or the preset was deleted by its creator.
        </p>
        <Button onClick={() => navigate('/presets')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Browse Public Presets
        </Button>
      </div>
    )
  }

  const totalCredits = preset.semesters.reduce((acc, sem) => {
    return acc + sem.modules.reduce((mAcc, mod) => mAcc + Number(mod.credits), 0)
  }, 0)

  return (
    <div className="min-h-screen bg-background text-foreground p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8 animate-slideUp">
        
        <div className="flex items-center gap-4 text-primary mb-6">
          <Button variant="ghost" className="p-0 hover:bg-transparent text-primary hover:text-primary/80" onClick={() => navigate('/presets')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Presets
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
          <div className="flex-1">
            <h1 className="text-3xl font-mono font-bold text-foreground">{preset.title}</h1>
            <p className="text-muted-foreground font-mono text-sm mt-2">{preset.institution || 'Unknown Institution'}</p>
            {preset.description && (
              <p className="text-muted-foreground font-mono text-sm mt-4 bg-card/50 p-4 rounded-lg border">
                {preset.description}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px] w-full md:w-auto">
            <Button 
              onClick={handleCopyLink}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono font-bold h-12 transition-colors"
            >
              {isLinkCopied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {isLinkCopied ? 'Link Copied!' : 'Share Link'}
            </Button>
            <Button 
              onClick={handleCopyCode}
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground font-mono font-bold h-12 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {isCopied ? 'Code Copied!' : `Code: ${preset.code}`}
            </Button>
          </div>
        </div>

        {/* Structure Preview */}
        <div>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-mono font-bold tracking-widest uppercase text-primary">
              Preset Structure
            </h2>
            <div className="text-right font-mono text-sm">
              <p className="text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
            </div>
          </div>

          <div className="space-y-6">
            {preset.semesters.length === 0 ? (
              <div className="text-center p-8 bg-card/30 border border-dashed rounded-lg">
                <p className="text-muted-foreground font-mono text-sm">This preset contains no semesters.</p>
              </div>
            ) : (
              preset.semesters.map((sem, i) => (
                <Card key={sem.id} className="bg-card border-border overflow-hidden">
                  <div className="bg-muted px-4 py-3 flex justify-between items-center">
                    <h3 className="font-mono font-bold text-foreground">{sem.title || `Semester ${i + 1}`}</h3>
                    <span className="font-mono text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                      {sem.modules.length} Modules
                    </span>
                  </div>
                  <div className="p-4">
                    {sem.modules.length === 0 ? (
                      <p className="text-muted-foreground font-mono text-sm text-center py-4">Empty semester</p>
                    ) : (
                      <div className="grid gap-2">
                        {sem.modules.map(mod => (
                          <div key={mod.id} className="flex justify-between items-center p-3 bg-background rounded border border-border">
                            <span className="font-mono text-sm text-foreground">{mod.name}</span>
                            <span className="font-mono text-xs text-muted-foreground font-bold bg-muted px-2 py-1 rounded">
                              {mod.credits} Cr
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 shadow-2xl z-50">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex-1 w-full flex flex-col gap-3">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-muted-foreground">
                <input 
                  type="radio" 
                  name="cloneMode" 
                  value="new"
                  checked={cloneMode === 'new'}
                  onChange={() => setCloneMode('new')}
                  className="accent-primary"
                />
                Create new degree
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-mono text-muted-foreground">
                <input 
                  type="radio" 
                  name="cloneMode" 
                  value="existing"
                  checked={cloneMode === 'existing'}
                  onChange={() => setCloneMode('existing')}
                  className="accent-primary"
                />
                Add to existing
              </label>
            </div>

            {cloneMode === 'new' ? (
              <Input 
                value={degreeTitle}
                onChange={e => setDegreeTitle(e.target.value)}
                placeholder={`Name your new degree (defaults to "${preset.title}")`}
                className="bg-card border-border text-foreground font-mono h-10 w-full md:max-w-md"
              />
            ) : (
              <select 
                value={targetDegreeId}
                onChange={e => setTargetDegreeId(e.target.value)}
                className="bg-card border border-border rounded-md px-3 text-foreground font-mono h-10 w-full md:max-w-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Select a degree --</option>
                {degrees.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            )}
          </div>
          <Button 
            onClick={handleClone}
            disabled={applyPreset.isPending}
            className="w-full md:w-auto h-12 px-8 bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono text-sm uppercase tracking-widest self-end"
          >
            {applyPreset.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <GraduationCap className="w-5 h-5 mr-2" />
            )}
            Clone to my Account
          </Button>
        </div>
      </div>
    </div>
  )
}
