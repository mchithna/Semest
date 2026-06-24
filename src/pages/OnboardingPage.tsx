import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { useGradeScales } from '@/hooks/useGradeScales'
import { useDegrees } from '@/hooks/useDegrees'
import { completeOnboarding } from '@/lib/queries/profiles'
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

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { scales, isLoading: scalesLoading } = useGradeScales()
  const { createDegree } = useDegrees()

  const [step, setStep] = useState(1)
  const [scaleId, setScaleId] = useState('none')
  const [title, setTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [startYear, setStartYear] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        start_year: startYear ? parseInt(startYear, 10) : null,
        grade_scale_id: scaleId === 'none' ? null : scaleId,
      })
      
      // Update profile
      await completeOnboarding()
      
      setStep(3)
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#34d399', '#6ee7b7', '#059669'] // Emerald shades
      })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    navigate('/dashboard')
  }

  if (scalesLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-emerald-400' : 'bg-[#1e293b]'}`} 
            />
          ))}
        </div>

        {/* Step 1: Welcome & Scale Pick */}
        {step === 1 && (
          <div className="bg-[#1e293b] border border-[#1e3a5f] p-8 rounded-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GraduationCap className="w-12 h-12 text-emerald-400 mb-6" />
            <h1 className="text-3xl font-mono font-bold tracking-widest uppercase text-slate-100 mb-2">Welcome to Semest</h1>
            <p className="text-slate-400 font-mono text-sm mb-8 leading-relaxed">
              Let's set up your academic profile. First, how does your university grade you? You can pick a standard scale now or create a custom one later in settings.
            </p>

            <div className="space-y-4 mb-8">
              <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Default Grade Scale</Label>
              <Select value={scaleId} onValueChange={setScaleId}>
                <SelectTrigger className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm h-12">
                  <SelectValue placeholder="Select a scale" />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#1e3a5f] text-slate-100">
                  <SelectItem value="none">I'll set this up later</SelectItem>
                  {scales.map(scale => (
                    <SelectItem key={scale.id} value={scale.id}>
                      {scale.label} {scale.is_system ? '(System)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleNextStep1}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest px-8"
              >
                Next Step <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: First Degree */}
        {step === 2 && (
          <div className="bg-[#1e293b] border border-[#1e3a5f] p-8 rounded-sm animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-mono font-bold tracking-widest uppercase text-emerald-400 mb-2">Your First Degree</h2>
            <p className="text-slate-400 font-mono text-sm mb-8 leading-relaxed">
              Create the main program you're currently studying. You can add more degrees or change these details later.
            </p>

            <div className="space-y-6 mb-8">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Degree Title <span className="text-rose-400">*</span></Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. BSc Computer Science"
                  className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Institution</Label>
                <Input
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. University of London"
                  className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Start Year</Label>
                <Input
                  type="number"
                  value={startYear}
                  onChange={(e) => setStartYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm h-12"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                variant="ghost"
                onClick={() => setStep(1)}
                className="text-slate-400 hover:text-slate-200 hover:bg-[#273449] rounded-sm font-mono text-xs uppercase tracking-widest"
              >
                Back
              </Button>
              <Button 
                onClick={handleNextStep2}
                disabled={isSubmitting}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest px-8"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Complete Setup
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="bg-[#1e293b] border border-[#1e3a5f] p-12 rounded-sm text-center animate-in zoom-in-95 duration-500">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl font-mono font-bold tracking-widest uppercase text-slate-100 mb-4">You're All Set!</h2>
            <p className="text-slate-400 font-mono text-sm mb-10 leading-relaxed max-w-xs mx-auto">
              Your profile is ready. Let's head over to your dashboard to view your degree.
            </p>
            <Button 
              onClick={handleFinish}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest px-12 h-14"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
