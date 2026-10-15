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

function primaryConfettiColor() {
  const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  return primary ? `hsl(${primary})` : 'hsl(160 84% 39%)'
}

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
        colors: [primaryConfettiColor()]
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
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} 
            />
          ))}
        </div>

        {/* Step 1: Welcome & Scale Pick */}
        {step === 1 && (
          <div className="bg-card border border-border p-8 rounded-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GraduationCap className="w-12 h-12 text-primary mb-6" />
            <h1 className="text-3xl font-sans font-bold tracking-tight text-foreground mb-2">Welcome to Semest</h1>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Let's set up your academic profile. First, how does your university grade you? You can pick a standard scale now or create a custom one later in settings.
            </p>

            <div className="space-y-4 mb-8">
              <Label htmlFor="onboarding-scale" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Default Grade Scale</Label>
              <Select value={scaleId} onValueChange={setScaleId}>
                <SelectTrigger id="onboarding-scale" className="bg-background border-border text-foreground rounded-xl h-12">
                  <SelectValue placeholder="Select a scale" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
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
                className="text-muted-foreground text-xs"
              >
                Skip for now
              </Button>
              <Button 
                onClick={handleNextStep1}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs px-8"
              >
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: First Degree */}
        {step === 2 && (
          <div className="bg-card border border-border p-8 rounded-xl animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-sans font-bold tracking-tight text-primary mb-2">Your first degree</h2>
            <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
              Create the main program you're currently studying. You can add more degrees or change these details later.
            </p>

            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <Label htmlFor="onboarding-title" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Degree Title <span className="text-destructive">*</span></Label>
                <Input
                  id="onboarding-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. BSc Computer Science"
                  className="bg-background border-border text-foreground rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-institution" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Institution</Label>
                <Input
                  id="onboarding-institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of London"
                  className="bg-background border-border text-foreground rounded-xl h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onboarding-year" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Start Year</Label>
                <Input
                  id="onboarding-year"
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="bg-background border-border text-foreground rounded-xl h-12"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl text-xs"
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep2}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs px-8"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Complete setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-card border border-border p-12 rounded-xl text-center animate-in zoom-in-95 duration-500">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-sans font-bold tracking-tight text-foreground mb-4">You're all set</h2>
            <p className="text-muted-foreground text-sm mb-10 leading-relaxed max-w-xs mx-auto">
              Your profile is ready. Let's head over to your dashboard to view your degree.
            </p>
            <Button 
              onClick={handleFinish}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs px-12 h-14"
            >
              Go to dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
