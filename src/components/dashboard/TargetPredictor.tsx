import { useState } from 'react'
import { Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import type { GradeRow } from '@/lib/queries/gradeScales'

type TargetPredictorProps = {
  currentCgpa: number
  earnedCredits: number
  gradeScale: GradeRow[]
}

export function TargetPredictor({ currentCgpa, earnedCredits, gradeScale }: TargetPredictorProps) {
  const [targetCgpa, setTargetCgpa] = useState<string>('')
  const [remainingCredits, setRemainingCredits] = useState<string>('30')

  const maxPoints = gradeScale.length > 0 ? Math.max(...gradeScale.map(g => g.points)) : 4.0

  const calculateRequiredGpa = () => {
    const target = parseFloat(targetCgpa)
    const remaining = parseFloat(remainingCredits)

    if (isNaN(target) || isNaN(remaining) || remaining <= 0) return null
    if (earnedCredits === 0) return target // if no credits earned yet, they just need the target

    const currentPoints = currentCgpa * earnedCredits
    const totalCredits = earnedCredits + remaining
    const requiredTotalPoints = target * totalCredits
    
    const neededPoints = requiredTotalPoints - currentPoints
    return neededPoints / remaining
  }

  const requiredGpa = calculateRequiredGpa()

  let statusMessage = null
  let statusIcon = null
  let statusColor = "text-slate-400"

  if (requiredGpa !== null) {
    if (requiredGpa > maxPoints) {
      statusMessage = "Mathematically impossible with current scale."
      statusIcon = <AlertTriangle className="w-4 h-4" />
      statusColor = "text-rose-400"
    } else if (requiredGpa <= 0) {
      statusMessage = "You have already secured this target!"
      statusIcon = <CheckCircle2 className="w-4 h-4" />
      statusColor = "text-emerald-400"
    } else if (requiredGpa > currentCgpa) {
      statusMessage = "You'll need to perform better than your current average."
      statusColor = "text-amber-400"
    } else {
      statusMessage = "Maintainable! You can afford to perform below your average."
      statusColor = "text-emerald-400"
    }
  }

  return (
    <Card className="bg-[#273449]/50 border-[#1e3a5f] p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-mono font-bold tracking-widest text-slate-100 uppercase">
          Target Predictor
        </h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Desired CGPA</Label>
          <Input 
            type="number" 
            step="0.01" 
            min="0" 
            max={maxPoints}
            value={targetCgpa} 
            onChange={(e) => setTargetCgpa(e.target.value)} 
            placeholder={`e.g. ${maxPoints.toFixed(2)}`}
            className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-mono text-slate-400 uppercase tracking-widest">Remaining Credits</Label>
          <Input 
            type="number" 
            step="1" 
            min="1"
            value={remainingCredits} 
            onChange={(e) => setRemainingCredits(e.target.value)} 
            className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono"
          />
        </div>
      </div>

      <div className="mt-auto bg-[#1e293b] rounded-lg border border-[#1e3a5f] p-4 text-center">
        {requiredGpa === null ? (
          <p className="text-sm font-mono text-slate-500">
            Enter a target CGPA to see what you need.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Required Average GPA
            </p>
            <div className={`text-4xl font-mono font-bold ${requiredGpa > maxPoints ? 'text-rose-400' : 'text-emerald-400'}`}>
              {requiredGpa > maxPoints ? (
                'Impossible'
              ) : requiredGpa <= 0 ? (
                'Secured'
              ) : (
                <AnimatedNumber value={requiredGpa} decimals={3} />
              )}
            </div>
            <div className={`flex items-start justify-center gap-2 mt-2 text-xs font-mono ${statusColor}`}>
              <div className="mt-0.5">{statusIcon}</div>
              <span className="text-left leading-relaxed">{statusMessage}</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
