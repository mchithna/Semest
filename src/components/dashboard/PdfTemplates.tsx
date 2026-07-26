import React from 'react'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import { computeScore } from '@/lib/score'

export type PdfExportOptions = {
  theme: 'official' | 'modern' | 'executive'
  studentName: string
  studentEmail: string
  reportTitle: string
  includeName: boolean
  includeMetadata: boolean
  includeStats: boolean
  includeModules: boolean
  includeTrendChart: boolean
  includeTargetGoal: boolean
  targetCgpa?: string
  remainingCredits?: string
}

type PdfTemplatesProps = {
  degree: DegreeWithScale | undefined
  semesters: SemesterWithModules[]
  metrics: {
    cgpa: number
    earnedCredits: number
    highestGpa: number
    standing: string
  }
  options: PdfExportOptions
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const PdfTemplates: React.FC<PdfTemplatesProps> = ({
  degree,
  semesters,
  metrics,
  options,
  containerRef,
}) => {
  if (!degree) return null

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const sortedSemesters = [...semesters].sort((a, b) => a.sem_index - b.sem_index)
  const gradeScale = degree.grade_scale?.grades || []

  // Theme-specific styles
  const isOfficial = options.theme === 'official'
  const isModern = options.theme === 'modern'

  return (
    <div className="fixed left-0 top-0 opacity-0 pointer-events-none -z-50 overflow-hidden">
      <div
        ref={containerRef}
        id="pdf-print-container"
        className={`w-[794px] p-8 box-border font-sans text-slate-900 ${
          isModern
            ? 'bg-slate-950 text-slate-100'
            : 'bg-white text-slate-900'
        }`}
        style={{ width: '794px', minHeight: '1123px', boxSizing: 'border-box' }}
      >
        {/* Header Section */}
        <div
          className={`pb-6 mb-6 border-b break-inside-avoid ${
            isModern
              ? 'border-slate-800'
              : isOfficial
              ? 'border-slate-900'
              : 'border-slate-300'
          }`}
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h1
                className={`text-2xl font-bold tracking-tight uppercase leading-tight ${
                  isModern
                    ? 'text-emerald-400 font-mono'
                    : isOfficial
                    ? 'text-slate-900 font-serif'
                    : 'text-slate-800'
                }`}
              >
                {options.reportTitle || degree.title}
              </h1>
              {options.includeMetadata && (
                <p className="text-xs text-slate-500 mt-1">
                  {degree.institution || 'University Academic Record'}{' '}
                  {degree.started_year ? `• Enrolled ${degree.started_year}` : ''}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded inline-block uppercase tracking-wider ${
                  isModern
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                }`}
              >
                {metrics.standing}
              </span>
              <p className="text-[11px] text-slate-400 mt-1.5 font-mono">Issued: {currentDate}</p>
            </div>
          </div>

          {/* Student Identity Meta */}
          {options.includeName && (options.studentName || options.studentEmail) && (
            <div
              className={`mt-4 pt-3 border-t text-xs flex gap-6 ${
                isModern ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
              }`}
            >
              {options.studentName && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Student Name</span>
                  <span className="font-semibold">{options.studentName}</span>
                </div>
              )}
              {options.studentEmail && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Email / ID</span>
                  <span className="font-mono">{options.studentEmail}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Grade Scale</span>
                <span className="font-medium">{degree.grade_scale?.label || 'Standard 4.0'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Executive Stats Bar */}
        {options.includeStats && (
          <div
            className="grid grid-cols-4 gap-4 mb-6 break-inside-avoid"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <div
              className={`p-3.5 rounded-lg border ${
                isModern
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                Cumulative GPA
              </div>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  isModern ? 'text-emerald-400' : 'text-slate-900'
                }`}
              >
                {metrics.cgpa.toFixed(3)}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                isModern
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                Earned Credits
              </div>
              <div className="text-xl font-bold font-mono mt-1 text-sky-500">
                {metrics.earnedCredits.toFixed(1)}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                isModern
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                Best Sem GPA
              </div>
              <div className="text-xl font-bold font-mono mt-1 text-amber-500">
                {metrics.highestGpa.toFixed(3)}
              </div>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                isModern
                  ? 'bg-slate-900/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                Semesters
              </div>
              <div className="text-xl font-bold font-mono mt-1 text-indigo-500">
                {semesters.length}
              </div>
            </div>
          </div>
        )}

        {/* GPA Trend Summary (if enabled) */}
        {options.includeTrendChart && sortedSemesters.length > 0 && (
          <div
            className="mb-6 p-4 rounded-lg border border-slate-200 bg-slate-50/50 break-inside-avoid"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Semester GPA Progression Summary
            </h3>
            <div className="flex gap-2 items-end h-16 pt-2 border-b border-slate-200 pb-1">
              {sortedSemesters.map((sem, i) => {
                const sgpa = computeScore(sem.modules, gradeScale)
                const pct = Math.min(100, Math.max(10, (sgpa / 4.0) * 100))
                return (
                  <div key={sem.id || i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-mono font-semibold text-slate-700">
                      {sgpa.toFixed(2)}
                    </span>
                    <div
                      className={`w-full rounded-t ${
                        isModern ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[9px] text-slate-500 font-mono truncate max-w-full">
                      {sem.term || `S${i + 1}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Target Predictor Goal Box (if enabled) */}
        {options.includeTargetGoal && options.targetCgpa && (
          <div
            className={`mb-6 p-4 rounded-lg border break-inside-avoid ${
              isModern ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-amber-50 border-amber-200 text-slate-800'
            }`}
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <div className="text-xs uppercase font-bold tracking-wider text-amber-600 mb-1">
              Academic Target Goal Summary
            </div>
            <div className="flex justify-between items-center text-xs font-mono">
              <span>Target CGPA: <strong>{options.targetCgpa}</strong></span>
              <span>Remaining Credits: <strong>{options.remainingCredits || '30'}</strong></span>
            </div>
          </div>
        )}

        {/* Semester & Module Grade Tables */}
        {options.includeModules && (
          <div className="space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              Detailed Course & Semester Breakdown
            </h2>

            {sortedSemesters.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No semester records registered.</p>
            ) : (
              sortedSemesters.map((sem, idx) => {
                const semGpa = computeScore(sem.modules, gradeScale)
                const semCredits = sem.modules.reduce((sum, m) => sum + m.credits, 0)

                return (
                  <div
                    key={sem.id || idx}
                    className={`rounded-lg border overflow-hidden break-inside-avoid ${
                      isModern ? 'border-slate-800 bg-slate-900/40 text-slate-200' : 'border-slate-200 bg-white text-slate-900'
                    }`}
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                  >
                    <div
                      className={`px-4 py-2.5 flex justify-between items-center text-xs font-semibold ${
                        isModern
                          ? 'bg-slate-800/80 text-slate-200'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="uppercase tracking-wider">
                        {sem.title} {sem.term ? `(${sem.term})` : ''}
                      </span>
                      <div className="flex gap-4 font-mono text-[11px]">
                        <span>Credits: {semCredits.toFixed(1)}</span>
                        <span>GPA: {semGpa.toFixed(2)}</span>
                      </div>
                    </div>

                    <table className="w-full text-left text-xs border-collapse table-fixed">
                      <thead>
                        <tr
                          className={`border-b text-[10px] uppercase font-bold tracking-wider ${
                            isModern
                              ? 'border-slate-800 text-slate-400 bg-slate-950/50'
                              : 'border-slate-200 text-slate-500 bg-slate-50'
                          }`}
                        >
                          <th className="py-2 px-4 w-12">#</th>
                          <th className="py-2 px-4">Module Name</th>
                          <th className="py-2 px-4 text-center w-24">Credits</th>
                          <th className="py-2 px-4 text-center w-24">Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sem.modules.map((mod, mIdx) => (
                          <tr
                            key={mod.id || mIdx}
                            className={`border-b last:border-0 break-inside-avoid ${
                              isModern ? 'border-slate-800/60' : 'border-slate-100'
                            }`}
                            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                          >
                            <td className="py-2 px-4 font-mono text-slate-400 text-[11px] w-12">
                              {mIdx + 1}
                            </td>
                            <td className="py-2 px-4 font-medium truncate">{mod.name}</td>
                            <td className="py-2 px-4 text-center font-mono w-24">{mod.credits}</td>
                            <td className="py-2 px-4 text-center font-mono font-bold w-24">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] inline-block ${
                                  isModern
                                    ? 'bg-slate-800 text-emerald-400'
                                    : 'bg-slate-100 text-slate-900 border border-slate-200'
                                }`}
                              >
                                {mod.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Footer Statement */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 break-inside-avoid" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          Generated automatically via UniScore Track • Academic Progression Report
        </div>
      </div>
    </div>
  )
}
