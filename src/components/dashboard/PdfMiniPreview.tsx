import React from 'react'
import { bandsForScale, markerPercent } from '@/lib/bands'
import { computeScore, formatGpa, hasGradedWork, totalCredits } from '@/lib/score'
import { compareSemesters } from '@/lib/semesterOrder'
import { cn } from '@/lib/utils'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import type { PdfExportOptions } from './PdfTemplates'
import { BAND_TONE_CLASS } from '@/components/ruler/tone'

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
  const isCompact = options.theme === 'executive'
  const scale = degree?.grade_scale?.grades ?? []
  const track = bandsForScale(scale)
  const sorted = [...semesters].sort(compareSemesters)
  const visibleSemesters = sorted.slice(0, isCompact ? 1 : 2)
  const moduleLimit = isCompact ? 3 : 2
  const generatedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const gradedCount = semesters.filter((semester) => hasGradedWork(semester.modules, scale)).length
  const ticks = [...track.bands.map((band) => band.min), track.max]

  return (
    <div
      className={cn(
        'w-full max-w-[340px] overflow-hidden text-[#1c1915] shadow-[0_16px_40px_rgba(0,0,0,0.35)]',
        isModern ? 'bg-white font-sans' : 'bg-[#f7f4ee]',
        options.theme === 'official' && 'font-serif',
      )}
      style={{ aspectRatio: options.pageSize === 'LETTER' ? '8.5 / 11' : '210 / 297' }}
    >
      {isModern && (
        <div className="flex h-[3px]" aria-hidden="true">
          <span className="flex-1 bg-band-pass" />
          <span className="flex-1 bg-band-second-lower" />
          <span className="flex-1 bg-band-second-upper" />
          <span className="flex-1 bg-band-first" />
        </div>
      )}
      <div className={cn('flex h-full flex-col', isCompact ? 'p-3' : 'p-4')}>
        <div className="flex items-start justify-between gap-2 border-b border-black/10 pb-2">
          <div className="min-w-0">
            <p className={cn('truncate font-semibold leading-tight', isCompact ? 'text-[12px]' : 'text-[13px]')}>
              {options.reportTitle || degree?.title || 'Academic Transcript'}
            </p>
            {options.includeMetadata && (
              <p className="mt-1 truncate text-[8px] tracking-wide text-black/45 uppercase">
                {degree?.institution || 'Institution'}
              </p>
            )}
          </div>
          {metrics.standing && (
            <span className="shrink-0 rounded-[2px] border border-black/15 px-1 py-0.5 text-[7px] tracking-wide text-black/55 uppercase">
              {metrics.standing}
            </span>
          )}
        </div>

        {options.includeName && (options.studentName || options.studentEmail) && (
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[7px] tracking-wide text-black/40 uppercase">Student name</p>
              <p className="truncate text-[9px] font-medium">{options.studentName || 'Student name'}</p>
            </div>
            <div className="min-w-0 text-right">
              <p className="text-[7px] tracking-wide text-black/40 uppercase">Email or ID</p>
              <p className="truncate text-[9px]">{options.studentEmail || '—'}</p>
            </div>
          </div>
        )}

        {options.includeStats && (
          <div className="mt-3 grid grid-cols-4 border-y border-black/10">
            <Stat label="CGPA" value={formatGpa(metrics.cgpa)} tone={isModern ? 'text-band-pass' : undefined} />
            <Stat
              label="Credits"
              value={formatCount(metrics.earnedCredits)}
              tone={isModern ? 'text-band-second-lower' : undefined}
            />
            <Stat
              label="Best semester"
              value={formatGpa(metrics.highestGpa)}
              tone={isModern ? 'text-band-second-upper' : undefined}
            />
            <Stat
              label="Graded"
              value={String(gradedCount)}
              tone={isModern ? 'text-band-first' : undefined}
              last
            />
          </div>
        )}

        {options.includeTrendChart && (
          <div className="mt-3">
            <p className="text-[8px] text-black/45">Classification</p>
            <div className="relative mt-1.5">
              <div className="flex h-1.5 overflow-hidden rounded-full">
                {track.bands.map((band) => {
                  const span = track.max - track.min
                  const width = span > 0 ? ((band.max - band.min) / span) * 100 : 0
                  return (
                    <div
                      key={band.id}
                      className={cn('h-full', BAND_TONE_CLASS[band.tone])}
                      style={{ width: `${width}%` }}
                    />
                  )
                })}
              </div>
              {metrics.earnedCredits > 0 && (
                <span
                  className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1c1915] ring-2 ring-white"
                  style={{ left: `${markerPercent(metrics.cgpa, track)}%` }}
                />
              )}
            </div>
            <div className="mt-1 flex justify-between text-[7px] text-black/40">
              {ticks.map((tick, index) => (
                <span key={`${tick}-${index}`}>{formatGpa(tick)}</span>
              ))}
            </div>
          </div>
        )}

        {options.includeTargetGoal && (
          <p className="mt-3 border-y border-black/10 py-1.5 text-[8px]">
            Target CGPA {options.targetCgpa || '—'} · {options.remainingCredits || '0'} credits left
          </p>
        )}

        {options.includeModules && (
          <div className="mt-3 space-y-2.5">
            {visibleSemesters.length === 0 && (
              <p className="text-[8px] text-black/40">No semesters yet.</p>
            )}
            {visibleSemesters.map((semester) => {
              const gpa = computeScore(semester.modules, scale)
              const credits = totalCredits(semester.modules)
              const modules = semester.modules.slice(0, moduleLimit)
              const hidden = semester.modules.length - modules.length
              return (
                <div key={semester.id}>
                  <div className="flex items-baseline justify-between gap-2 border-b border-black/10 pb-1">
                    <p className="truncate text-[8px] font-semibold">{semesterLabel(semester)}</p>
                    <p className="shrink-0 text-[8px]">
                      GPA {formatGpa(gpa)}, {formatCount(credits)} credits
                    </p>
                  </div>
                  <div>
                    {modules.map((mod) => (
                      <div key={mod.id} className="flex items-baseline justify-between gap-2 border-b border-black/10 py-0.5">
                        <span className="truncate text-[8px]">{mod.name}</span>
                        <span className="shrink-0 text-[8px]">{mod.grade}</span>
                      </div>
                    ))}
                    {hidden > 0 && (
                      <p className="pt-0.5 text-[7px] text-black/40 italic">
                        and {hidden} more {hidden === 1 ? 'module' : 'modules'}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {sorted.length > visibleSemesters.length && (
              <p className="text-[7px] text-black/40 italic">
                and {sorted.length - visibleSemesters.length} more{' '}
                {sorted.length - visibleSemesters.length === 1 ? 'semester' : 'semesters'}
              </p>
            )}
          </div>
        )}

        <p className="mt-auto border-t border-black/10 pt-2 text-[7px] text-black/40">
          Generated by Semest on {generatedOn}. Not an official transcript.
        </p>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
  last = false,
}: {
  label: string
  value: string
  tone?: string
  last?: boolean
}) {
  return (
    <div className={cn('px-1 py-1.5', !last && 'border-r border-black/10')}>
      <p className="text-[6px] tracking-wide text-black/40 uppercase">{label}</p>
      <p className={cn('text-[12px] leading-tight font-semibold', tone)}>{value}</p>
    </div>
  )
}

function semesterLabel(semester: SemesterWithModules) {
  if (semester.term && !semester.title.toLowerCase().includes(semester.term.toLowerCase())) {
    return `${semester.title}, ${semester.term}`
  }
  return semester.title
}

function formatCount(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
