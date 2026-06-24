import { useMemo } from 'react'
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
import { computeScore } from '@/lib/score'

type GpaTrendChartProps = {
  semesters: SemesterWithModules[]
  gradeScale: GradeRow[]
}

export function GpaTrendChart({ semesters, gradeScale }: GpaTrendChartProps) {
  const data = useMemo(() => {
    // Sort semesters to ensure chronological order if not already
    const sorted = [...semesters].sort((a, b) => a.sem_index - b.sem_index)
    return sorted.map((sem, i) => {
      const gpa = computeScore(sem.modules, gradeScale)
      return {
        name: sem.term || sem.title || `Sem ${i + 1}`,
        gpa: Number(gpa.toFixed(2)),
      }
    })
  }, [semesters, gradeScale])

  const maxPoints = useMemo(() => {
    if (!gradeScale || gradeScale.length === 0) return 4.0
    return Math.max(...gradeScale.map(g => g.points), 4.0)
  }, [gradeScale])

  if (data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center text-slate-500 font-mono text-sm">
        No data to display
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
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, Math.ceil(maxPoints)]} 
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              color: '#f8fafc',
              fontFamily: 'monospace'
            }}
            itemStyle={{ color: '#34d399' }}
          />
          <Area
            type="monotone"
            dataKey="gpa"
            stroke="#34d399"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorGpa)"
            activeDot={{ r: 6, fill: '#34d399', stroke: '#1e293b', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
