import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, Copy, Check, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePreset, useApplyPreset } from '@/hooks/usePresets'
import { useDegrees } from '@/hooks/useDegrees'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
import { LIMITS } from '@/lib/limits'
import { Input } from '@/components/ui/input'
import { cardAccentClass } from '@/components/ruler/tone'

export default function PresetDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: preset, isLoading, isError } = usePreset(code || '')
  const applyPreset = useApplyPreset()
  const { degrees } = useDegrees(Boolean(session))

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
    toast.success('Share code copied')
  }

  const handleCopyLink = () => {
    if (!preset) return
    const url = `${window.location.origin}/presets/${preset.code}`
    navigator.clipboard.writeText(url)
    setIsLinkCopied(true)
    setTimeout(() => setIsLinkCopied(false), 2000)
    toast.success('Share link copied')
  }

  const handleClone = () => {
    if (!preset) return

    if (cloneMode === 'existing' && !targetDegreeId) {
      toast.error('Choose a degree to add this preset to.')
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
          toast.success('Preset added')
          if (preset.scale_snapshot && (!preset.grade_scale_id || (preset.grade_scale && !preset.grade_scale.is_system))) {
             toast.success('Grade scale copied')
          }
          navigate(`/degrees/${newDegreeId}/semesters`)
        },
        onError: (err: any) => {
          toast.error(friendlyError(err, "Couldn't add the preset. Try again."))
        }
      }
    )
  }

  if (isLoading) {
    return (
      <div role="status" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <title>Preset · Semest</title>
        <span className="sr-only">Loading</span>
        <div className="h-14 w-72 animate-pulse rounded-full bg-muted" />
        <div className="mt-8 h-40 animate-pulse rounded-[22px] bg-muted" />
      </div>
    )
  }

  if (isError || !preset) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4">
        <title>Preset not found · Semest</title>
        <div className="w-full rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Preset not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            That share code is not a public preset, or it was removed.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/presets')}>
            Browse presets
          </Button>
        </div>
      </div>
    )
  }

  const totalCredits = preset.semesters.reduce((acc, sem) => {
    return acc + sem.modules.reduce((mAcc, mod) => mAcc + Number(mod.credits), 0)
  }, 0)

  return (
    <div className="min-h-screen bg-background pb-40 text-foreground">
      <title>{`${preset.title} · Semest`}</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Button variant="ghost" className="mb-4 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => navigate('/presets')}>
          Back to presets
        </Button>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">{preset.title}</h1>
            {preset.institution?.trim() ? (
              <p className="mt-3 text-sm text-muted-foreground">{preset.institution.trim()}</p>
            ) : null}
            {preset.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">{preset.description}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {preset.is_public ? (
              <>
                <Button onClick={handleCopyLink}>
                  {isLinkCopied ? <Check /> : <Share2 />}
                  {isLinkCopied ? 'Link copied' : 'Share link'}
                </Button>
                <Button onClick={handleCopyCode} variant="outline">
                  {isCopied ? <Check /> : <Copy />}
                  {isCopied ? 'Code copied' : preset.code}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Private preset. Code {preset.code} is not shared publicly.
              </p>
            )}
          </div>
        </div>

        {/* Structure Preview */}
        <div className="mt-12">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Preset structure</h2>
            <p className="text-sm text-muted-foreground">{totalCredits} credits</p>
          </div>

          <div className="space-y-4">
            {preset.semesters.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-foreground/20 px-8 py-10 text-center">
                <p className="text-sm text-muted-foreground">This preset has no semesters.</p>
              </div>
            ) : (
              preset.semesters.map((sem, i) => (
                <section key={sem.id} className="overflow-hidden rounded-[22px] bg-card">
                  <div className={`h-[3px] ${cardAccentClass(i)}`} aria-hidden="true" />
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-medium">{sem.title || `Semester ${i + 1}`}</h3>
                      <span className="text-xs text-muted-foreground">
                        {sem.modules.length} {sem.modules.length === 1 ? 'module' : 'modules'}
                      </span>
                    </div>
                    {sem.modules.length === 0 ? (
                      <p className="mt-4 text-sm text-muted-foreground">No modules added</p>
                    ) : (
                      <ul className="mt-4 divide-y divide-border/70">
                        {sem.modules.map(mod => (
                          <li key={mod.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                            <span>{mod.name}</span>
                            <span className="tabular-nums text-muted-foreground">{mod.credits} credits</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          {session ? (
            <>
              <div className="flex-1 w-full flex flex-col gap-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
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
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
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
                    maxLength={LIMITS.degreeTitle}
                    className="h-10 w-full rounded-full md:max-w-md"
                  />
                ) : (
                  <select 
                    value={targetDegreeId}
                    onChange={e => setTargetDegreeId(e.target.value)}
                    className="h-10 w-full rounded-full border border-input bg-transparent px-3 text-sm md:max-w-md"
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
                className="w-full self-end md:w-auto"
              >
                {applyPreset.isPending && <Loader2 className="animate-spin" />}
                Clone to my account
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground text-pretty">
                Sign in to clone this preset into your account.
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full md:w-auto"
              >
                Get started for free
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
