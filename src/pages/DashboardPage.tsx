import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Activity, Target, Plus } from 'lucide-react'
import { useDegrees } from '@/hooks/useDegrees'
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
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const [activeDegreeId, setActiveDegreeId] = useState<string>('')

  // Set the first degree as active by default when loaded
  useEffect(() => {
    if (degrees.length > 0 && !activeDegreeId) {
      setActiveDegreeId(degrees[0].id)
    }
  }, [degrees, activeDegreeId])

  if (isDegreesLoading) {
    return (
      <div className="min-h-screen bg-[#1e293b] flex items-center justify-center">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    )
  }

  // If user has no degrees, prompt them to create one
  if (degrees.length === 0) {
    return (
      <div className="min-h-screen bg-[#1e293b] flex flex-col items-center justify-center p-8 text-center">
        <GraduationCap className="w-16 h-16 text-slate-500 mb-6 opacity-50" />
        <h2 className="text-2xl font-mono font-bold tracking-widest text-slate-100 uppercase mb-2">No Degrees Found</h2>
        <p className="text-slate-400 font-mono text-sm mb-8 max-w-md">
          You need to set up a degree profile before you can access the dashboard analytics.
        </p>
        <Button 
          onClick={() => navigate('/degrees')}
          className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" />
          Setup Degree
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header & Degree Selector */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1e3a5f] pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-emerald-400">
              Dashboard Analytics
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2">
              Track your academic progression and goals.
            </p>
          </div>
          
          <div className="w-full md:w-64">
            <Select value={activeDegreeId} onValueChange={setActiveDegreeId}>
              <SelectTrigger className="bg-[#273449] border-[#1e3a5f] text-slate-100 font-mono text-sm h-10">
                <SelectValue placeholder="Select a degree" />
              </SelectTrigger>
              <SelectContent className="bg-[#273449] border-[#1e3a5f] text-slate-100 font-mono">
                {degrees.map((deg) => (
                  <SelectItem key={deg.id} value={deg.id} className="hover:bg-[#1e3a5f] focus:bg-[#1e3a5f] cursor-pointer">
                    {deg.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metric Cards Skeleton Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-[#273449]/50 border-[#1e3a5f] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#1e3a5f]"></div>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-[#1e3a5f] rounded w-1/2"></div>
                <div className="h-8 bg-[#1e3a5f] rounded w-3/4"></div>
                <div className="h-3 bg-[#1e3a5f] rounded w-full"></div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Area Skeletons */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Chart Skeleton */}
          <Card className="lg:col-span-2 bg-[#273449]/50 border-[#1e3a5f] p-6 min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4 w-full h-full justify-center">
              <Activity className="w-12 h-12 text-[#1e3a5f] opacity-50" />
              <div className="h-4 bg-[#1e3a5f] rounded w-48"></div>
              <div className="h-[200px] bg-[#1e3a5f]/50 rounded w-full max-w-lg mt-4"></div>
            </div>
          </Card>
          
          {/* Secondary Widget Skeleton */}
          <Card className="bg-[#273449]/50 border-[#1e3a5f] p-6 min-h-[400px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-4 w-full">
              <Target className="w-12 h-12 text-[#1e3a5f] opacity-50" />
              <div className="h-4 bg-[#1e3a5f] rounded w-32"></div>
              <div className="h-10 bg-[#1e3a5f] rounded w-full mt-4"></div>
              <div className="h-10 bg-[#1e3a5f] rounded w-full"></div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
