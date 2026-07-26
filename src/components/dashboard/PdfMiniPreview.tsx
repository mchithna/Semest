import React from 'react'
import type { PdfExportOptions } from './PdfTemplates'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'

type PdfMiniPreviewProps = {
  degree: DegreeWithScale | undefined
  semesters: SemesterWithModules[]
  metrics: {
    cgpa: number
    earnedCredits: number
    highestGpa: number
    standing: string
  }
  options: PdfExportOptions
}

export const PdfMiniPreview: React.FC<PdfMiniPreviewProps> = ({
  degree,
  semesters,
  metrics,
  options,
}) => {
  const isModern = options.theme === 'modern'
  const isExecutive = options.theme === 'executive'

  return (
    <div className="flex flex-col items-center">
      <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Live Page Layout Preview
      </div>

      {/* A4 Sheet Miniature Representation */}
      <div
        className={`w-[260px] h-[360px] rounded-md shadow-2xl border p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between select-none ${
          isModern
            ? 'bg-slate-950 border-slate-800 text-slate-200 font-mono'
            : isExecutive
            ? 'bg-white border-indigo-200 text-slate-900 font-sans shadow-indigo-500/10'
            : 'bg-white border-slate-300 text-slate-900 font-serif'
        }`}
      >
        <div className="space-y-3">
          {/* Header Block */}
          <div
            className={`pb-2 border-b ${
              isModern
                ? 'border-slate-800'
                : isExecutive
                ? 'border-indigo-100'
                : 'border-slate-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div
                  className={`text-[11px] font-bold truncate max-w-[150px] uppercase ${
                    isModern
                      ? 'text-emerald-400 font-mono'
                      : isExecutive
                      ? 'text-indigo-600 font-sans'
                      : 'text-slate-900 font-serif'
                  }`}
                >
                  {options.reportTitle || degree?.title || 'Academic Report'}
                </div>
                {options.includeMetadata && (
                  <div
                    className={`text-[8px] truncate max-w-[140px] ${
                      isExecutive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  >
                    {degree?.institution || 'University Name'}
                  </div>
                )}
              </div>
              <div
                className={`text-[7px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${
                  isModern
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isExecutive
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                }`}
              >
                {metrics.standing.split(' ')[0]}
              </div>
            </div>

            {/* Student Name Meta */}
            {options.includeName && (options.studentName || options.studentEmail) && (
              <div
                className={`mt-1.5 pt-1 border-t border-dashed text-[8px] flex justify-between ${
                  isModern
                    ? 'border-slate-800 text-slate-400'
                    : isExecutive
                    ? 'border-indigo-100 text-slate-600'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <span className="truncate max-w-[110px]">
                  {options.studentName || 'Student Name'}
                </span>
                <span className="font-mono text-[7px]">
                  {options.studentEmail || 'student@univ.edu'}
                </span>
              </div>
            )}
          </div>

          {/* Executive Stats Cards Preview */}
          {options.includeStats && (
            <div className="grid grid-cols-4 gap-1">
              <div
                className={`p-1 rounded text-center border ${
                  isModern
                    ? 'bg-slate-900 border-slate-800'
                    : isExecutive
                    ? 'bg-indigo-50/50 border-indigo-100'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[6px] uppercase text-slate-400">CGPA</div>
                <div
                  className={`text-[9px] font-bold font-mono ${
                    isModern
                      ? 'text-emerald-400'
                      : isExecutive
                      ? 'text-indigo-600'
                      : 'text-slate-900'
                  }`}
                >
                  {metrics.cgpa.toFixed(2)}
                </div>
              </div>

              <div
                className={`p-1 rounded text-center border ${
                  isModern
                    ? 'bg-slate-900 border-slate-800'
                    : isExecutive
                    ? 'bg-indigo-50/50 border-indigo-100'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[6px] uppercase text-slate-400">Credits</div>
                <div className="text-[9px] font-bold font-mono text-sky-500">
                  {metrics.earnedCredits.toFixed(0)}
                </div>
              </div>

              <div
                className={`p-1 rounded text-center border ${
                  isModern
                    ? 'bg-slate-900 border-slate-800'
                    : isExecutive
                    ? 'bg-indigo-50/50 border-indigo-100'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[6px] uppercase text-slate-400">Best</div>
                <div className="text-[9px] font-bold font-mono text-amber-500">
                  {metrics.highestGpa.toFixed(2)}
                </div>
              </div>

              <div
                className={`p-1 rounded text-center border ${
                  isModern
                    ? 'bg-slate-900 border-slate-800'
                    : isExecutive
                    ? 'bg-indigo-50/50 border-indigo-100'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="text-[6px] uppercase text-slate-400">Sems</div>
                <div
                  className={`text-[9px] font-bold font-mono ${
                    isExecutive ? 'text-indigo-600' : 'text-indigo-500'
                  }`}
                >
                  {semesters.length}
                </div>
              </div>
            </div>
          )}

          {/* Trend Chart Miniature Bar Sketch */}
          {options.includeTrendChart && (
            <div
              className={`p-1.5 rounded border ${
                isModern
                  ? 'bg-slate-900 border-slate-800'
                  : isExecutive
                  ? 'bg-indigo-50/50 border-indigo-100'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[7px] uppercase font-bold text-slate-400 mb-1">
                GPA Trend Graph
              </div>
              <div className="flex items-end gap-1 h-6 pt-1">
                {[65, 80, 75, 95, 90].map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t ${
                      isModern
                        ? 'bg-emerald-500'
                        : isExecutive
                        ? 'bg-indigo-600'
                        : 'bg-slate-800'
                    }`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Target Goal Summary Preview */}
          {options.includeTargetGoal && (
            <div
              className={`p-1.5 rounded border text-[8px] flex justify-between ${
                isModern
                  ? 'bg-slate-900 border-slate-800 text-amber-400'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <span className="font-semibold">Target CGPA: {options.targetCgpa || '3.70'}</span>
              <span>Req: {options.remainingCredits || '30'} CR</span>
            </div>
          )}

          {/* Module Tables Sketch */}
          {options.includeModules && (
            <div className="space-y-1.5">
              <div className="text-[7px] font-bold uppercase tracking-wider text-slate-400">
                Semester Course Breakdowns
              </div>

              {[1, 2].map((sIdx) => (
                <div
                  key={sIdx}
                  className={`rounded border text-[7px] p-1.5 ${
                    isModern
                      ? 'border-slate-800 bg-slate-900/60'
                      : isExecutive
                      ? 'border-indigo-100 bg-indigo-50/30'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between font-semibold border-b border-slate-300/30 pb-0.5 mb-1">
                    <span>Semester {sIdx}</span>
                    <span
                      className={`font-mono ${
                        isModern
                          ? 'text-emerald-400'
                          : isExecutive
                          ? 'text-indigo-600'
                          : 'text-slate-800'
                      }`}
                    >
                      GPA: 3.85
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Advanced Algorithms</span>
                      <span className="font-mono">A+</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Database Systems</span>
                      <span className="font-mono">A</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mini Watermark Footer */}
        <div className="text-[6px] text-center text-slate-400 border-t border-slate-300/20 pt-1">
          A4 Document • UniScore Export Engine
        </div>
      </div>
    </div>
  )
}
