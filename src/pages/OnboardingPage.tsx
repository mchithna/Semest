import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, Loader2, CheckCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useGradeScales } from '@/hooks/useGradeScales'
import { useDegrees } from '@/hooks/useDegrees'
import { completeOnboarding, getProfile, hasFinishedOnboarding, rememberOnboarded } from '@/lib/queries/profiles'
import { saveSemester } from '@/lib/queries/semesters'
import { useAuth } from '@/context/AuthContext'
import { friendlyError } from '@/lib/errors'
import { LIMITS } from '@/lib/limits'
import { cn } from '@/lib/utils'
import { cardAccentClass } from '@/components/ruler/tone'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { classBandsOf } from '@/lib/bands'
import { loadGuestDraft, sameGradeScale, type GuestDraft } from '@/lib/guestDraft'
import { isUntouchedDraft } from '@/lib/semesterDraft'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const GUEST_DRAFT_KEY = 'semest_guest_draft'

const SCALE_CHOICES = [
  {
    match: 'Standard 4.0',
    name: 'Standard GPA Scale',
    body: 'Standard A+ (4.0) to F grading scale used by most universities.',
  },
  {
    match: 'Sri Lankan UGC GPA',
    name: '4.2 UGC Scale ( A+ = 4.2 )',
    body: 'Enhanced scale used by state & technical faculties (e.g., Moratuwa) where A+ awards 4.2 points.',
  },
] as const

type StartPath = 'blank' | 'draft' | 'preset'

function readStartingDraft(): GuestDraft | null {
  try {
    const raw = sessionStorage.getItem(GUEST_DRAFT_KEY)
    if (!raw) return null
    const draft = loadGuestDraft(raw)
    if (!draft || draft.modules.length === 0 || isUntouchedDraft(draft.modules)) return null
    return draft
  } catch {
    return null
  }
}

const PRESET_GUIDE = [
  {
    title: 'Find your program',
    body: 'Open community presets and search by title, institution, or share code.',
  },
  {
    title: 'Open it',
    body: 'Choose Use preset. The semesters and modules are there to review before anything is copied.',
  },
  {
    title: 'Clone it',
    body: 'Leave Create new degree selected. Keep the preset name, or type your own, then choose Clone to my account.',
  },
] as const

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { scales, isLoading: scalesLoading } = useGradeScales()
  const { createDegree, updateDegree } = useDegrees()

  const [step, setStep] = useState(1)
  const [startPath, setStartPath] = useState<StartPath>('blank')
  const [scaleId, setScaleId] = useState<string | null>(null)
  const [degreeId, setDegreeId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [startYear, setStartYear] = useState('')
  const [semesterTitle, setSemesterTitle] = useState('Year 1, Semester 1')
  const [semesterTerm, setSemesterTerm] = useState('')
  const [isSavingSemester, setIsSavingSemester] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [guestDraft] = useState(readStartingDraft)
  const semesterTitleTouched = useRef(false)
  const savedFirstId = useRef<string | null>(null)
  const finishedDegreeId = useRef<string | null>(null)
  const alreadyDone = Boolean(session && hasFinishedOnboarding(session.user.id))

  useEffect(() => {
    const userId = session?.user.id
    if (!userId || hasFinishedOnboarding(userId)) return
    let cancelled = false
    getProfile()
      .then((profile) => {
        if (cancelled || !profile?.onboarded_at) return
        rememberOnboarded(userId)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        // Offline, and this device has no record yet. Leave the setup screen.
      })
    return () => {
      cancelled = true
    }
  }, [navigate, session])

  const scaleChoices = SCALE_CHOICES.flatMap((choice) => {
    const scale = scales.find((item) => item.is_system && item.label === choice.match)
    return scale ? [{ ...choice, id: scale.id, grades: scale.grades, scale }] : []
  })
  const selectedScaleId = scaleId ?? scaleChoices[0]?.id ?? 'none'
  const choseScaleLater = selectedScaleId === 'none'
  const selectedChoice = scaleChoices.find((choice) => choice.id === selectedScaleId) ?? null

  const initialModules = startPath === 'draft' && guestDraft ? guestDraft.modules : []

  const draftScaleDiffers = Boolean(
    startPath === 'draft' &&
    guestDraft &&
    selectedChoice &&
    !sameGradeScale(guestDraft.grades, selectedChoice.grades),
  )

  const handleSkip = async () => {
    try {
      await completeOnboarding()
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Couldn't skip setup. Try again."))
    }
  }

  const handleNextStart = () => {
    setStep(2)
  }

  const handleBrowsePresets = async () => {
    setIsFinishing(true)
    try {
      await completeOnboarding()
      navigate('/presets')
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Couldn't finish setup. Try again."))
      setIsFinishing(false)
    }
  }

  const handleNextStep2 = () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (draftScaleDiffers && guestDraft) {
      toast.warning(`This draft was calculated on ${guestDraft.scaleLabel}. This degree uses a different scale, so the GPA can change.`)
    }
    setStep(3)
  }

  const handleSaveSemester = async (modules: ModuleData[]) => {
    setIsSavingSemester(true)
    try {
      const payload = {
        title: title.trim(),
        institution: institution.trim() || null,
        started_year: startYear.trim() ? parseInt(startYear, 10) : null,
        grade_scale_id: selectedScaleId === 'none' ? null : selectedScaleId,
      }
      let id = degreeId
      if (!id) {
        const degree = await createDegree(payload)
        id = degree.id
        setDegreeId(id)
      } else {
        await updateDegree({ id, ...payload })
      }
      const saved = await saveSemester(
        id,
        semesterTitle,
        modules,
        semesterTerm.trim() || null,
        undefined,
        savedFirstId.current ?? undefined,
      )
      savedFirstId.current = saved.id

      if (startPath === 'draft') sessionStorage.removeItem(GUEST_DRAFT_KEY)
      finishedDegreeId.current = id
      await completeOnboarding()
      navigate(`/dashboard?degree=${id}`)
    } catch (err: unknown) {
      toast.error(friendlyError(err, "Couldn't save the semester. Try again."))
      throw err
    } finally {
      setIsSavingSemester(false)
    }
  }

  if (alreadyDone) {
    const next = finishedDegreeId.current
    return <Navigate to={next ? `/dashboard?degree=${next}` : '/dashboard'} replace />
  }

  if (scalesLoading) {
    return (
      <div role="status" className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  const sourceNote = startPath === 'draft' && guestDraft
    ? `These modules are from your calculator draft on ${guestDraft.scaleLabel}.`
    : ''

  return (
    <div className="bg-background px-4 pb-12 pt-8 text-foreground sm:pt-10">
      <div className="mx-auto w-full max-w-6xl">

        <div className="mb-8 flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-foreground' : 'bg-muted'}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="overflow-hidden rounded-[22px] bg-card">
            <div className={`h-[3px] ${cardAccentClass(0)}`} aria-hidden="true" />
            <div className="p-6 sm:p-8">
              <GraduationCap className="mb-6 size-8 text-band-pass" />
              <h1 className="font-display text-3xl font-semibold tracking-tight">How do you want to start?</h1>
              <p className="mb-8 mt-2 text-sm leading-relaxed text-muted-foreground">
                Start with a blank degree, continue a calculator draft, or copy a community preset.
              </p>

              <div role="radiogroup" aria-label="How do you want to start?" className="mb-8 space-y-3">
                <StartChoice
                  selected={startPath === 'blank'}
                  title="Start blank"
                  body="Name the degree, choose a scale, then add one empty module."
                  onSelect={() => setStartPath('blank')}
                />
                {guestDraft ? (
                  <StartChoice
                    selected={startPath === 'draft'}
                    title="Continue the calculator draft"
                    body={`Your draft used ${guestDraft.scaleLabel}.`}
                    onSelect={() => setStartPath('draft')}
                  />
                ) : null}
                <StartChoice
                  selected={startPath === 'preset'}
                  title="Use a community preset"
                  body="A short guide, then you browse presets and clone one."
                  onSelect={() => setStartPath('preset')}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip for now
                </Button>
                <Button onClick={handleNextStart}>
                  Next <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && startPath === 'preset' && (
          <div className="overflow-hidden rounded-[22px] bg-card">
            <div className={`h-[3px] ${cardAccentClass(1)}`} aria-hidden="true" />
            <div className="p-6 sm:p-8">
              <h2 className="font-display text-3xl font-semibold tracking-tight">Clone a preset</h2>
              <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
                A preset already has the degree, the grade scale, and the modules. Three steps copy it onto your account.
              </p>
              <ol className="mb-8 grid gap-4 md:grid-cols-3">
                {PRESET_GUIDE.map((item, index) => (
                  <li key={item.title} className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-medium text-background">
                        {index + 1}
                      </span>
                      <p className="text-sm font-medium">{item.title}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    <PresetStepPreview step={index} />
                  </li>
                ))}
              </ol>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && startPath !== 'preset' && (
          <div className="overflow-hidden rounded-[22px] bg-card">
            <div className={`h-[3px] ${cardAccentClass(1)}`} aria-hidden="true" />
            <div className="p-6 sm:p-8">
              <h2 className="font-display text-3xl font-semibold tracking-tight">Your first degree</h2>
              <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
                {startPath === 'draft'
                  ? 'This draft has modules, and it still needs a degree name. You can change these details later.'
                  : 'Name the program you are studying. You can change these details later.'}
                {choseScaleLater ? ' Grades will not score until you set a scale.' : ''}
              </p>

              <div className="mb-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_10rem]">
                <div className="space-y-2">
                  <Label htmlFor="onboarding-title" className="text-sm text-muted-foreground">Degree title <span className="text-destructive">*</span></Label>
                  <Input
                    id="onboarding-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. BSc Computer Science"
                    maxLength={LIMITS.degreeTitle}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboarding-institution" className="text-sm text-muted-foreground">Institution</Label>
                  <Input
                    id="onboarding-institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. University of London"
                    maxLength={LIMITS.institution}
                    aria-describedby="onboarding-institution-help"
                    className="h-12 rounded-xl"
                  />
                  <p id="onboarding-institution-help" className="text-xs text-muted-foreground">
                    Shown on transcripts. You can add it later.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboarding-year" className="text-sm text-muted-foreground">Start year</Label>
                  <Input
                    id="onboarding-year"
                    type="number"
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="e.g. 2024"
                    className="h-12 rounded-xl"
                  />
                </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">How does your university grade you?</p>
                  <div role="radiogroup" aria-label="Grade scale" className="grid gap-3 md:grid-cols-3">
                    {scaleChoices.map((choice) => (
                      <ChoiceCard
                        key={choice.id}
                        selected={selectedScaleId === choice.id}
                        title={choice.name}
                        body={choice.body}
                        onSelect={() => setScaleId(choice.id)}
                      />
                    ))}
                    <ChoiceCard
                      selected={choseScaleLater}
                      title="Choose later"
                      body="Grades will not score until you set a scale."
                      onSelect={() => setScaleId('none')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)} disabled={Boolean(degreeId)}>
                  Back
                </Button>
                <Button onClick={handleNextStep2}>
                  Next <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && startPath === 'preset' && (
          <div className="overflow-hidden rounded-[22px] bg-card">
            <div className={`h-[3px] ${cardAccentClass(3)}`} aria-hidden="true" />
            <div className="p-6 text-center sm:p-8">
              <CheckCircle className="mx-auto mb-6 size-10 text-band-first" />
              <h2 className="font-display text-3xl font-semibold tracking-tight">You're all set</h2>
              <p className="mx-auto mb-8 mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Browse presets and clone one. The degree lands on your account with its modules ready for grades.
              </p>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={isFinishing}>
                  Back
                </Button>
                <Button onClick={handleBrowsePresets} disabled={isFinishing}>
                  {isFinishing ? <Loader2 className="animate-spin" /> : null}
                  Browse presets <ArrowRight />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && startPath !== 'preset' && (
          <div className="overflow-hidden rounded-[22px] bg-card">
            <div className={`h-[3px] ${cardAccentClass(2)}`} aria-hidden="true" />
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="font-display text-3xl font-semibold tracking-tight">Your first semester</h2>
                {sourceNote ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{sourceNote}</p>
                ) : null}
                {choseScaleLater ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    Grades will not score until you set a scale.
                  </p>
                ) : null}
                {draftScaleDiffers && guestDraft ? (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    This draft was calculated on {guestDraft.scaleLabel}. This degree uses a different scale, so the GPA can change.
                  </p>
                ) : null}
              </div>

            <Calculator
                key={startPath}
                initialModules={initialModules}
                gradeScale={selectedChoice?.grades ?? []}
                classBands={classBandsOf(selectedChoice?.scale)}
                detailsChanged
                requireGrade={startPath === 'blank' && Boolean(selectedChoice)}
                onSave={handleSaveSemester}
                isSaving={isSavingSemester}
                summaryClassName="bg-background"
                footer={({ save, canSave, saving, saved }) => (
                  <div className="mt-6 flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(2)} disabled={saving}>
                      Back
                    </Button>
                    <Button onClick={save} disabled={saving || saved || !canSave}>
                      {saving ? <Loader2 className="animate-spin" /> : null}
                      {saving ? 'Saving...' : saved ? 'Saved' : 'Save semester'}
                    </Button>
                  </div>
                )}
                details={
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)]">
                    <div className="space-y-2">
                      <Label htmlFor="onboarding-semester-title">Title</Label>
                      <Input
                        id="onboarding-semester-title"
                        value={semesterTitle}
                        onChange={(event) => {
                          semesterTitleTouched.current = true
                          setSemesterTitle(event.target.value)
                        }}
                        placeholder="e.g. Year 1, Semester 1"
                        maxLength={LIMITS.semesterTitle}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onboarding-semester-term">Term (optional)</Label>
                      <Input
                        id="onboarding-semester-term"
                        value={semesterTerm}
                        onChange={(event) => setSemesterTerm(event.target.value)}
                        placeholder="e.g. Fall 2026"
                        maxLength={LIMITS.term}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function PresetStepPreview({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div aria-hidden="true" className="pointer-events-none mt-3 rounded-xl bg-background p-3">
        <div className="flex h-9 items-center gap-2 rounded-full bg-muted/70 px-3 text-xs text-muted-foreground">
          <Search className="size-3.5 shrink-0" />
          Search by title, institution or code
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 rounded-[14px] bg-card px-3 py-2">
          <div>
            <p className="text-sm font-medium">BSc Computer Science</p>
            <p className="text-xs text-muted-foreground">University</p>
          </div>
          <span className="rounded-full border border-foreground/15 px-2.5 py-1 text-xs">Use preset</span>
        </div>
      </div>
    )
  }
  if (step === 1) {
    return (
      <div aria-hidden="true" className="pointer-events-none mt-3 space-y-2 rounded-xl bg-background px-3 py-2.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span>Year 1, Semester 1</span>
          <span className="text-xs text-muted-foreground">6 modules</span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-2">
          <span>Programming</span>
          <span className="text-xs text-muted-foreground">3 credits</span>
        </div>
      </div>
    )
  }
  return (
    <div aria-hidden="true" className="pointer-events-none mt-3 rounded-xl bg-background p-3">
      <p className="text-xs text-muted-foreground">Create new degree</p>
      <div className="mt-2 h-9 rounded-full bg-muted/70 px-3 text-xs leading-9 text-muted-foreground">
        Name your new degree
      </div>
      <div className="mt-2 inline-flex h-9 items-center rounded-full bg-foreground px-3 text-xs text-background">
        Clone to my account
      </div>
    </div>
  )
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2',
        selected ? 'border-foreground' : 'border-foreground/45',
      )}
    >
      {selected ? <span className="size-2 rounded-full bg-foreground" /> : null}
    </span>
  )
}

function ChoiceCard({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean
  title: string
  body: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full gap-3 rounded-[18px] bg-background px-4 py-3 text-left',
        selected ? 'ring-2 ring-foreground' : 'hover:ring-1 hover:ring-foreground/30',
      )}
    >
      <RadioMark selected={selected} />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="mt-1 block text-sm leading-relaxed text-foreground/80">{body}</span>
      </span>
    </button>
  )
}

function StartChoice({
  selected,
  title,
  body,
  onSelect,
}: {
  selected: boolean
  title: string
  body: string
  onSelect: () => void
}) {
  return (
    <ChoiceCard selected={selected} title={title} body={body} onSelect={onSelect} />
  )
}
