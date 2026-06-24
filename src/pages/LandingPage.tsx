import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator } from '@/components/calculator/Calculator'
import type { ModuleData } from '@/components/calculator/ModuleRow'
import { Button } from '@/components/ui/button'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const DEFAULT_GUEST_SCALE = [
  { grade: "A+", points: 4.0 }, { grade: "A", points: 4.0 }, { grade: "A-", points: 3.7 },
  { grade: "B+", points: 3.3 }, { grade: "B", points: 3.0 }, { grade: "B-", points: 2.7 },
  { grade: "C+", points: 2.3 }, { grade: "C", points: 2.0 }, { grade: "C-", points: 1.7 },
  { grade: "D+", points: 1.3 }, { grade: "D", points: 1.0 }, { grade: "F", points: 0.0 }
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
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
    <div className="min-h-screen bg-[#1e293b] text-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b border-[#1e3a5f] bg-[#1e293b]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xl tracking-widest uppercase">
            <GraduationCap className="w-6 h-6" />
            Semest
          </div>
          <div className="flex gap-4">
            {session ? (
              <Button onClick={() => navigate('/dashboard')} className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono text-xs uppercase tracking-widest">
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')} variant="outline" className="border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 font-mono text-xs uppercase tracking-widest">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center pt-24 pb-12 px-6">
        <div className="text-center max-w-3xl mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-emerald-300 to-emerald-600 bg-clip-text text-transparent">
            Track Your Academic Journey
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Calculate your GPA effortlessly, set targets for upcoming semesters, and manage your degree progress all in one place.
          </p>
          <div className="pt-4">
            <Button size="lg" onClick={() => navigate('/auth')} className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono text-sm uppercase tracking-widest shadow-lg shadow-emerald-400/20">
              Get Started for Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Guest Calculator Demo */}
        <div className="w-full max-w-4xl bg-gradient-to-b from-[#1e3a5f]/20 to-transparent p-1 rounded-3xl">
          <div className="w-full bg-[#1e293b] rounded-[22px] p-6 md:p-12 border border-[#1e3a5f]/50 shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-mono font-bold tracking-widest text-slate-100 uppercase mb-2">
                Try the Calculator
              </h2>
              <p className="text-slate-400 text-sm">
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
      </main>
    </div>
  )
}
