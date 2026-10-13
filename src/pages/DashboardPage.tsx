import { useState, useEffect } from 'react'
import { getProfile } from '@/lib/queries/profiles'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Activity, Target, Plus, Trophy, BookOpen, FileDown } from 'lucide-react'
import { useDegrees } from '@/hooks/useDegrees'
import { useSemesters } from '@/hooks/useSemesters'
import { useAuth } from '@/context/AuthContext'
import { getCumulativeMetrics } from '@/lib/analytics'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { GpaTrendChart } from '@/components/dashboard/GpaTrendChart'
import { TargetPredictor } from '@/components/dashboard/TargetPredictor'
import { ExportPdfModal } from '@/components/dashboard/ExportPdfModal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const [activeDegreeId, setActiveDegreeId] = useState<string>('')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setStudentName(profile?.display_name || user?.email?.split('@')[0] || '')
      })
      .catch(() => setStudentName(user?.email?.split('@')[0] || ''))
  }, [user])

  const activeDegree = degrees.find(d => d.id === activeDegreeId)
  const { semesters, isLoading: isSemestersLoading } = useSemesters(activeDegreeId)

  // Set the first degree as active by default when loaded
  useEffect(() => {
    if (degrees.length > 0 && !activeDegreeId) {
      setActiveDegreeId(degrees[0].id)
    }
  }, [degrees, activeDegreeId])

  if (isDegreesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // If user has no degrees, prompt them to create one
  if (degrees.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <GraduationCap className="w-16 h-16 text-muted-foreground mb-6 opacity-50" />
        <h2 className="text-2xl font-mono font-bold tracking-widest text-foreground uppercase mb-2">No Degrees Found</h2>
        <p className="text-muted-foreground font-mono text-sm mb-8 max-w-md">
          You need to set up a degree profile before you can access the dashboard analytics.
        </p>
        <Button 
          onClick={() => navigate('/degrees')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" />
          Setup Degree
        </Button>
      </div>
    )
  }

  const metrics = getCumulativeMetrics(semesters, activeDegree?.grade_scale?.grades || [])

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      {/* Export PDF Settings Modal */}
      <ExportPdfModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        degree={activeDegree}
        semesters={semesters}
        metrics={metrics}
        defaultStudentName={studentName}
        defaultStudentEmail={user?.email || ''}
      />

      <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header & Degree Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-primary">
              Dashboard Analytics
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-2">
              Track your academic progression and goals.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              onClick={() => setIsExportModalOpen(true)}
              disabled={!activeDegree || isSemestersLoading}
              variant="outline"
              className="bg-card border-border hover:bg-muted text-foreground font-mono text-sm h-10 px-4 rounded-sm"
            >
              <FileDown className="w-4 h-4 mr-2 text-primary" />
              Export PDF
            </Button>

            <div className="w-full sm:w-64">
              <Select value={activeDegreeId} onValueChange={setActiveDegreeId}>
                <SelectTrigger className="bg-card border-border text-foreground font-mono text-sm h-10">
                  <SelectValue placeholder="Select a degree" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground font-mono">
                  {degrees.map((deg) => (
                    <SelectItem key={deg.id} value={deg.id} className="cursor-pointer">
                      {deg.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Metric Cards Skeleton Grid */}
        {isSemestersLoading ? (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-card/50 border-border p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-border"></div>
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:bg-white/10 hover:border-white/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg text-primary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Cumulative GPA</p>
                  <h3 className="text-3xl font-mono font-bold text-foreground mt-1">
                    <AnimatedNumber value={metrics.cgpa} decimals={3} />
                  </h3>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Overall performance
              </p>
            </Card>

            <Card className="relative overflow-hidden p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:bg-white/10 hover:border-white/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-sky-400/20 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-sky-400/10 rounded-lg text-sky-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Passing Credits</p>
                  <h3 className="text-3xl font-mono font-bold text-foreground mt-1">
                    <AnimatedNumber value={metrics.earnedCredits} decimals={1} />
                  </h3>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {metrics.attemptedCredits.toFixed(1)} graded, including fails
              </p>
            </Card>

            <Card className="relative overflow-hidden p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:bg-white/10 hover:border-white/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-400/10 rounded-lg text-amber-400">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Highest Sem GPA</p>
                  <h3 className="text-3xl font-mono font-bold text-foreground mt-1">
                    <AnimatedNumber value={metrics.highestGpa} decimals={3} />
                  </h3>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                Best performing semester
              </p>
            </Card>

            <Card className="relative overflow-hidden p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] group transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] hover:bg-white/10 hover:border-white/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-indigo-400/20 via-transparent to-transparent opacity-40 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-400/10 rounded-lg text-indigo-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">Standing</p>
                  <h3 className="text-lg font-mono font-bold text-foreground mt-3 truncate" title={metrics.standing}>
                    {metrics.standing || '—'}
                  </h3>
                </div>
              </div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {metrics.standing ? 'Current academic status' : 'This scale has no class band'}
              </p>
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chart */}
          <Card className="lg:col-span-2 bg-card/50 border-border p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-mono font-bold tracking-widest text-foreground uppercase">
                GPA Progression
              </h2>
            </div>
            <div className="flex-1 w-full min-h-[300px]">
              {isSemestersLoading ? (
                <div className="w-full h-full flex items-center justify-center animate-pulse bg-muted rounded-lg"></div>
              ) : (
                <GpaTrendChart semesters={semesters} gradeScale={activeDegree?.grade_scale?.grades || []} />
              )}
            </div>
          </Card>
          
          {/* Secondary Widget: Target Predictor */}
          <div className="lg:col-span-1 min-h-[400px]">
            {isSemestersLoading ? (
              <Card className="bg-card/50 border-border p-6 h-full flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4 w-full">
                  <Target className="w-12 h-12 text-border opacity-50" />
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-10 bg-muted rounded w-full mt-4"></div>
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
              </Card>
            ) : (
              <TargetPredictor 
                currentCgpa={metrics.cgpa}
                earnedCredits={metrics.attemptedCredits}
                gradeScale={activeDegree?.grade_scale?.grades || []}
                initialRemaining={metrics.ungradedCredits}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
