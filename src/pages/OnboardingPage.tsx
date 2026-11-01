import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useGradeScales } from '@/hooks/useGradeScales'
import { useDegrees } from '@/hooks/useDegrees'
import { completeOnboarding, getProfile, hasFinishedOnboarding, rememberOnboarded } from '@/lib/queries/profiles'
import { useAuth } from '@/context/AuthContext'
import { prefersReducedMotion } from '@/lib/motion'
import { friendlyError } from '@/lib/errors'
import { LIMITS } from '@/lib/limits'
import { cardAccentClass } from '@/components/ruler/tone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CONFETTI_COLORS = ['#5B6CFF', '#38B6C9', '#E6B84A', '#F07A5A']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { scales, isLoading: scalesLoading } = useGradeScales()
  const { createDegree } = useDegrees()

  const [step, setStep] = useState(1)
  const [scaleId, setScaleId] = useState('none')
  const [title, setTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [startYear, setStartYear] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleNextStep1 = () => {
    setStep(2)
  }

  const handleNextStep2 = async () => {
    if (!title.trim()) return toast.error('Title is required')

    setIsSubmitting(true)
    try {
      await createDegree({
        title: title.trim(),
        institution: institution.trim() || null,
        started_year: startYear ? parseInt(startYear, 10) : null,
        grade_scale_id: scaleId === 'none' ? null : scaleId,
      })
      
      // Update profile
      await completeOnboarding()
      
      setStep(3)
      if (!prefersReducedMotion()) confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: CONFETTI_COLORS
      })
    } catch (err: any) {
      toast.error(friendlyError(err, "Couldn't finish setup. Try again."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    navigate('/dashboard')
  }

  if (alreadyDone) {
    return <Navigate to="/dashboard" replace />
  }

  if (scalesLoading) {
    return (
      <div role="status" className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        
        {/* Progress Bar */}
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
            <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome to Semest</h1>
            <p className="mb-8 mt-2 text-sm leading-relaxed text-muted-foreground">
              Let's set up your academic profile. First, how does your university grade you? You can pick a standard scale now or create a custom one later in settings.
            </p>

            <div className="mb-8 space-y-2">
              <Label htmlFor="onboarding-scale" className="text-sm text-muted-foreground">Default grade scale</Label>
              <Select value={scaleId} onValueChange={setScaleId}>
                <SelectTrigger id="onboarding-scale" className="h-12 rounded-xl">
                  <SelectValue placeholder="Select a scale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">I'll set this up later</SelectItem>
                  {scales.map(scale => (
                    <SelectItem key={scale.id} value={scale.id}>
                      {scale.label} {scale.is_system ? '(System)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={async () => {
                  try {
                    await completeOnboarding()
                    navigate('/dashboard')
                  } catch (err: any) {
                    toast.error(friendlyError(err, "Couldn't skip setup. Try again."))
                  }
                }}
              >
                Skip for now
              </Button>
              <Button onClick={handleNextStep1}>
                Next <ArrowRight />
              </Button>
            </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="overflow-hidden rounded-[22px] bg-card">
            <div className={`h-[3px] ${cardAccentClass(1)}`} aria-hidden="true" />
            <div className="p-6 sm:p-8">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Your first degree</h2>
            <p className="mb-8 mt-2 text-sm leading-relaxed text-muted-foreground">
              Create the main program you're currently studying. You can add more degrees or change these details later.
            </p>

            <div className="mb-8 space-y-6">
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
                  className="h-12 rounded-xl"
                />
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

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={handleNextStep2} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                Complete setup
              </Button>
            </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="overflow-hidden rounded-[22px] bg-card text-center">
            <div className={`h-[3px] ${cardAccentClass(3)}`} aria-hidden="true" />
            <div className="px-6 py-12 sm:px-8">
            <CheckCircle className="mx-auto mb-6 size-10 text-band-first" />
            <h2 className="font-display text-3xl font-semibold tracking-tight">You're all set</h2>
            <p className="mx-auto mb-10 mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your profile is ready. Let's head over to your dashboard to view your degree.
            </p>
            <Button onClick={handleFinish} size="lg">
              Go to dashboard <ArrowRight />
            </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
