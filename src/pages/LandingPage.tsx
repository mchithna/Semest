import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { Button } from '@/components/ui/button'
import { GraduationCap, ArrowRight, LineChart, Library, Loader2 } from 'lucide-react'
import { BAND_TEXT_CLASS, cardAccentClass } from '@/components/ruler/tone'
import { GUEST_SCALE, loadGuestDraft, saveGuestDraft } from '@/lib/guestDraft'
import { useAuth } from '@/context/AuthContext'

export default function LandingPage() {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [initialModules, setInitialModules] = useState<ModuleData[]>([])

  // Load from session storage if exists
  useEffect(() => {
    const saved = sessionStorage.getItem('semest_guest_draft')
    if (saved) {
      try {
        setInitialModules(loadGuestDraft(saved)?.modules ?? [])
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const handleGuestSave = (modules: ModuleData[]) => {
    saveGuestDraft(modules)
    navigate('/auth')
  }

  if (loading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const features = [
    {
      icon: GraduationCap,
      tone: 'pass' as const,
      title: 'Track several degrees',
      body: 'Keep dual degrees, majors, and minors in one place, each with its own GPA.',
    },
    {
      icon: LineChart,
      tone: 'second-lower' as const,
      title: 'See your progress',
      body: 'See each semester on the scale, and the average you need for the next class.',
    },
    {
      icon: Library,
      tone: 'second-upper' as const,
      title: 'Community presets',
      body: 'Clone a degree structure published by another student instead of typing every module.',
    },
  ]

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
            Track your academic journey
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
            Calculate a semester GPA, set a class target, and keep every degree in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get started for free
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/presets')}>
              Browse presets
            </Button>
          </div>
        </div>

        <div className="mt-16 w-full">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Try the calculator
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Calculate a semester below. Save it to keep your draft when you sign up.
            </p>
          </div>
          <Calculator
            key={initialModules.length ? 'loaded' : 'empty'}
            initialModules={initialModules}
            gradeScale={GUEST_SCALE}
            onSave={handleGuestSave}
          />
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <article key={feature.title} className="overflow-hidden rounded-[22px] bg-card">
                <div className={`h-[3px] ${cardAccentClass(index)}`} aria-hidden="true" />
                <div className="p-6">
                  <Icon className={`size-5 ${BAND_TEXT_CLASS[feature.tone]}`} aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mx-auto mt-20 mb-4 w-full max-w-3xl overflow-hidden rounded-[22px] bg-card text-center">
          <div className="flex h-[3px]" aria-hidden="true">
            <div className="flex-1 bg-band-pass" />
            <div className="flex-1 bg-band-second-lower" />
            <div className="flex-1 bg-band-second-upper" />
            <div className="flex-1 bg-band-first" />
          </div>
          <div className="px-6 py-12">
            <h2 className="font-display text-3xl font-semibold tracking-tight">Ready to keep your grades?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Track your GPA and reuse degree presets built by other students.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={() => navigate('/auth')}>
                Create free account
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/presets')}>
                Browse presets
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
