import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { GradeRow } from '@/lib/queries/gradeScales'
import { computeScore, formatGpa, hasGradedWork } from '@/lib/score'
import { compareSemesters } from '@/lib/semesterOrder'
import { Button } from '@/components/ui/button'

const chartPrimary = 'hsl(var(--primary))'
const chartMuted = 'hsl(var(--muted-foreground))'
const chartBorder = 'hsl(var(--border))'
const chartCard = 'hsl(var(--card))'
const chartForeground = 'hsl(var(--foreground))'

type GpaTrendChartProps = {
  semesters: SemesterWithModules[]
  gradeScale: GradeRow[]
  degreeId: string
}

export function GpaTrendChart({ semesters, gradeScale, degreeId }: GpaTrendChartProps) {
  const data = useMemo(() => {
    // Sort semesters to ensure chronological order if not already
    const sorted = [...semesters].sort(compareSemesters)
    const validSemesters = sorted.filter(sem => hasGradedWork(sem.modules, gradeScale))
    
    return validSemesters.map((sem, i) => {
      const gpa = computeScore(sem.modules, gradeScale)
      return {
        name: sem.term || sem.title || `Sem ${i + 1}`,
        gpa: Number(formatGpa(gpa)),
      }
    })
  }, [semesters, gradeScale])

  const maxPoints = useMemo(() => {
    if (!gradeScale || gradeScale.length === 0) return 4.0
    return Math.max(...gradeScale.map(g => g.points), 4.0)
  }, [gradeScale])

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          Your GPA trend appears after two graded semesters.
        </p>
        {degreeId && (
          <Button asChild>
            <Link to={`/degrees/${degreeId}/semesters/new`}>Add semester</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartPrimary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartPrimary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={chartBorder} vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke={chartMuted} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke={chartMuted} 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, Math.ceil(maxPoints)]} 
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: chartCard, 
              border: `1px solid ${chartBorder}`,
              borderRadius: '8px',
              color: chartForeground,
              fontFamily: 'monospace'
            }}
            itemStyle={{ color: chartPrimary }}
          />
          <Area
            type="monotone"
            dataKey="gpa"
            stroke={chartPrimary}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorGpa)"
            activeDot={{ r: 6, fill: chartPrimary, stroke: chartCard, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
