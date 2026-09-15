import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { Button } from '@/components/ui/button'
import { GraduationCap, ArrowRight } from 'lucide-react'
const DEFAULT_GUEST_SCALE = [
  { grade: "A+", points: 4.0 }, { grade: "A", points: 4.0 }, { grade: "A-", points: 3.7 },
  { grade: "B+", points: 3.3 }, { grade: "B", points: 3.0 }, { grade: "B-", points: 2.7 },
  { grade: "C+", points: 2.3 }, { grade: "C", points: 2.0 }, { grade: "C-", points: 1.7 },
  { grade: "D+", points: 1.3 }, { grade: "D", points: 1.0 }, { grade: "F", points: 0.0 }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [initialModules, setInitialModules] = useState<ModuleData[]>([])

  // Load from session storage if exists
  useEffect(() => {
    const saved = sessionStorage.getItem('semest_guest_draft')
    if (saved) {
      try {
        setInitialModules(JSON.parse(saved))
      } catch (e) {
        // ignore
      }
    }
  }, [])

  const handleGuestSave = (modules: ModuleData[]) => {
    sessionStorage.setItem('semest_guest_draft', JSON.stringify(modules))
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-16 pb-12 px-6 animate-slideUp">
        <div className="text-center max-w-3xl mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-emerald-300 to-emerald-600 bg-clip-text text-transparent">
            Track Your Academic Journey
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculate your GPA effortlessly, set targets for upcoming semesters, and manage your degree progress all in one place.
          </p>
          <div className="pt-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono text-sm uppercase tracking-widest shadow-lg shadow-primary/20 mr-4">
              Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/presets')} className="text-primary hover:text-primary/80 font-mono text-sm uppercase tracking-widest">
              Browse Presets
            </Button>
          </div>
        </div>

        {/* Guest Calculator Demo */}
        <div className="w-full max-w-4xl bg-gradient-to-b from-border/50 to-transparent p-1 rounded-3xl">
          <div className="w-full bg-card rounded-[22px] p-6 md:p-12 border shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-mono font-bold tracking-widest text-foreground uppercase mb-2">
                Try the Calculator
              </h2>
              <p className="text-muted-foreground text-sm">
                Calculate a semester below. Save it to keep your draft when you sign up!
              </p>
            </div>
            
            {/* The calculator key resets when initialModules loads */}
            <Calculator 
              key={initialModules.length ? 'loaded' : 'empty'}
              initialModules={initialModules}
              gradeScale={DEFAULT_GUEST_SCALE}
              onSave={handleGuestSave}
            />
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="w-full max-w-6xl mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-card border p-8 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-400/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-mono font-bold text-foreground mb-3">Track Multiple Degrees</h3>
            <p className="text-muted-foreground">
              Easily manage different academic programs in one place. Keep track of dual degrees, majors, and minors separately.
            </p>
          </div>

          <div className="bg-card border p-8 rounded-2xl">
            <div className="w-12 h-12 bg-sky-400/10 text-sky-400 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h3 className="text-xl font-mono font-bold text-foreground mb-3">Visualize Progress</h3>
            <p className="text-muted-foreground">
              Watch your GPA climb with beautiful, interactive trend charts. Analyze your performance semester-by-semester.
            </p>
          </div>

          <div className="bg-card border p-8 rounded-2xl">
            <div className="w-12 h-12 bg-amber-400/10 text-amber-400 rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
            </div>
            <h3 className="text-xl font-mono font-bold text-foreground mb-3">Community Presets</h3>
            <p className="text-muted-foreground">
              Don't manually enter modules. Clone complete degree structures published by other students in seconds.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full max-w-4xl mt-24 mb-12 bg-card border p-12 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-sky-400"></div>
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to optimize your grades?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of students who are already using Semest to track their academic progress and discover community-built degree presets.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono text-sm uppercase tracking-widest">
              Create Free Account
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/presets')} className="text-primary hover:text-primary/80 font-mono text-sm uppercase tracking-widest">
              Browse Presets
            </Button>
          </div>
        </div>

      </main>
    </div>
  )
}
