import React, { useEffect, useRef, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
import { hasGradedWork } from '@/lib/score'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import { PdfTemplates, type PdfExportOptions } from './PdfTemplates'
import { PdfMiniPreview } from './PdfMiniPreview'
import { ReactPdfDocument } from './ReactPdfDocument'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type ExportPdfModalProps = {
  isOpen: boolean
  onClose: () => void
  degree: DegreeWithScale | undefined
  semesters: SemesterWithModules[]
  metrics: {
    cgpa: number
    earnedCredits: number
    highestGpa: number
    standing: string
  }
  defaultStudentName?: string
  defaultStudentEmail?: string
}

type ThemeId = PdfExportOptions['theme']

const THEMES: { id: ThemeId; title: string; detail: string; art: 'ruled' | 'color' | 'compact' }[] = [
  { id: 'official', title: 'Official Academic', detail: 'Serif, ruled tables', art: 'ruled' },
  { id: 'modern', title: 'Semest Modern', detail: 'Color and ruler', art: 'color' },
  { id: 'executive', title: 'Compact Snapshot', detail: 'One page summary', art: 'compact' },
]

const DETAIL_TOGGLES: { key: 'includeName' | 'includeMetadata'; label: string }[] = [
  { key: 'includeName', label: 'Student name and email' },
  { key: 'includeMetadata', label: 'Degree and institution' },
]

const CONTENT_TOGGLES: { key: 'includeStats' | 'includeTrendChart' | 'includeModules' | 'includeTargetGoal'; label: string }[] = [
  { key: 'includeStats', label: 'Summary figures' },
  { key: 'includeTrendChart', label: 'Classification ruler' },
  { key: 'includeModules', label: 'Semester and module tables' },
  { key: 'includeTargetGoal', label: 'Target goal' },
]

function pdfFileName(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `${slug || 'academic-transcript'}.pdf`
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  degree,
  semesters,
  metrics,
  defaultStudentName = '',
  defaultStudentEmail = '',
}) => {
  const printContainerRef = useRef<HTMLDivElement | null>(null)
  const titleEdited = useRef(false)
  const fileNameTouched = useRef(false)
  const [isExporting, setIsExporting] = useState(false)
  const [renamingFile, setRenamingFile] = useState(false)
  const [fileDraft, setFileDraft] = useState('')
  const [fileName, setFileName] = useState('academic-transcript.pdf')

  const [options, setOptions] = useState<PdfExportOptions>({
    theme: 'official',
    pageSize: 'A4',
    studentName: defaultStudentName,
    studentEmail: defaultStudentEmail,
    reportTitle: 'Academic Transcript',
    includeName: true,
    includeMetadata: true,
    includeStats: true,
    includeModules: true,
    includeTrendChart: true,
    includeTargetGoal: false,
    targetCgpa: '3.70',
    remainingCredits: '30',
  })

  useEffect(() => {
    if (!isOpen || !degree) return
    setOptions((prev) => {
      const nextTitle = titleEdited.current ? prev.reportTitle : `${degree.title} Academic Transcript`
      const nextName = prev.studentName || defaultStudentName
      const nextEmail = prev.studentEmail || defaultStudentEmail
      if (nextTitle === prev.reportTitle && nextName === prev.studentName && nextEmail === prev.studentEmail) {
        return prev
      }
      return { ...prev, reportTitle: nextTitle, studentName: nextName, studentEmail: nextEmail }
    })
  }, [isOpen, degree, defaultStudentName, defaultStudentEmail])

  useEffect(() => {
    if (!fileNameTouched.current) setFileName(pdfFileName(options.reportTitle))
  }, [options.reportTitle])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen || !degree) return null

  const scale = degree.grade_scale?.grades ?? []
  const gradedCount = semesters.filter((semester) => hasGradedWork(semester.modules, scale)).length
  const subtitle = `${degree.title}, ${gradedCount} graded ${gradedCount === 1 ? 'semester' : 'semesters'}`

  const handleToggleOption = (key: keyof PdfExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const commitFileName = (event?: React.FormEvent) => {
    event?.preventDefault()
    fileNameTouched.current = true
    setFileName(pdfFileName(fileDraft))
    setRenamingFile(false)
  }

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      const blob = await pdf(
        <ReactPdfDocument degree={degree} semesters={semesters} metrics={metrics} options={options} />,
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('PDF downloaded')
      onClose()
    } catch (err: unknown) {
      console.error('PDF export error:', err)
      toast.error(friendlyError(err, "Couldn't create the PDF. Try again."))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
      onClick={onClose}
    >
      <PdfTemplates
        degree={degree}
        semesters={semesters}
        metrics={metrics}
        options={options}
        containerRef={printContainerRef}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-pdf-title"
        className="flex h-[min(92vh,900px)] w-full max-w-[1080px] flex-col overflow-hidden rounded-[28px] border border-foreground/10 bg-card text-foreground shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6">
          <div>
            <h2 id="export-pdf-title" className="font-display text-2xl font-semibold tracking-tight">
              Export PDF report
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-foreground/15 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto px-5 py-5 sm:px-7 md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] md:overflow-hidden">
          <div className="min-h-0 space-y-6 md:overflow-y-auto md:pr-1">
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-3">
                {THEMES.map((theme) => {
                  const selected = options.theme === theme.id
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setOptions((prev) => ({ ...prev, theme: theme.id }))}
                      className={cn(
                        'flex flex-col items-center rounded-2xl border px-2 py-4 text-center transition-colors',
                        selected
                          ? 'border-foreground/50 bg-[#222848]'
                          : 'border-foreground/15 bg-background/40 hover:border-foreground/25',
                      )}
                    >
                      <ThemeSheet kind={theme.art} />
                      <span className="mt-3 text-sm font-medium leading-tight">{theme.title}</span>
                      <span className="mt-1 text-xs text-muted-foreground">{theme.detail}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-title">Title</Label>
              <Input
                id="export-title"
                value={options.reportTitle}
                onChange={(event) => {
                  titleEdited.current = true
                  setOptions((prev) => ({ ...prev, reportTitle: event.target.value }))
                }}
                className="h-11 rounded-full border-foreground/10 bg-background px-4"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="export-student">Student name</Label>
                <Input
                  id="export-student"
                  value={options.studentName}
                  placeholder="Your full name"
                  onChange={(event) => setOptions((prev) => ({ ...prev, studentName: event.target.value }))}
                  className="h-11 rounded-full border-foreground/10 bg-background px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="export-email">Email or ID</Label>
                <Input
                  id="export-email"
                  value={options.studentEmail}
                  placeholder="name@university.edu"
                  onChange={(event) => setOptions((prev) => ({ ...prev, studentEmail: event.target.value }))}
                  className="h-11 rounded-full border-foreground/10 bg-background px-4"
                />
              </div>
            </div>

            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">Details</legend>
              <div className="divide-y divide-foreground/10">
                {DETAIL_TOGGLES.map((item) => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    checked={options[item.key]}
                    onChange={() => handleToggleOption(item.key)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-1">
              <legend className="text-sm font-medium">Content</legend>
              <div className="divide-y divide-foreground/10">
                {CONTENT_TOGGLES.map((item) => (
                  <ToggleRow
                    key={item.key}
                    label={item.label}
                    checked={options[item.key]}
                    onChange={() => handleToggleOption(item.key)}
                  />
                ))}
              </div>
              {options.includeTargetGoal && (
                <div className="grid gap-3 pt-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="export-target">Target CGPA</Label>
                    <Input
                      id="export-target"
                      value={options.targetCgpa}
                      onChange={(event) => setOptions((prev) => ({ ...prev, targetCgpa: event.target.value }))}
                      className="h-11 rounded-full border-foreground/10 bg-background px-4"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-remaining">Remaining credits</Label>
                    <Input
                      id="export-remaining"
                      value={options.remainingCredits}
                      onChange={(event) => setOptions((prev) => ({ ...prev, remainingCredits: event.target.value }))}
                      className="h-11 rounded-full border-foreground/10 bg-background px-4"
                    />
                  </div>
                </div>
              )}
            </fieldset>
          </div>

          <div className="flex min-h-[420px] flex-col rounded-[22px] bg-background p-4 md:min-h-0 md:h-full">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm">
                <span className="font-medium">Preview</span>{' '}
                <span className="text-muted-foreground">Page 1 of 1</span>
              </p>
              <div className="flex items-center rounded-full bg-card p-1" role="group" aria-label="Page size">
                {(['A4', 'LETTER'] as const).map((size) => {
                  const selected = options.pageSize === size
                  return (
                    <button
                      key={size}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setOptions((prev) => ({ ...prev, pageSize: size }))}
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                        selected ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {size === 'LETTER' ? 'Letter' : 'A4'}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto">
              <PdfMiniPreview degree={degree} semesters={semesters} metrics={metrics} options={options} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/10 px-5 py-4 sm:px-7">
          <div className="min-w-0 text-sm text-muted-foreground">
            {renamingFile ? (
              <form onSubmit={commitFileName} className="flex items-center gap-2">
                <span className="shrink-0">Saves as</span>
                <input
                  autoFocus
                  aria-label="File name"
                  value={fileDraft}
                  onChange={(event) => setFileDraft(event.target.value)}
                  onBlur={() => commitFileName()}
                  className="h-9 w-52 rounded-full border border-foreground/15 bg-background px-3 text-sm text-foreground outline-hidden focus-visible:ring-2 focus-visible:ring-ring/50"
                />
                <span>.pdf</span>
              </form>
            ) : (
              <p className="truncate">
                Saves as <span className="text-foreground">{fileName}</span>{' '}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-2"
                  onClick={() => {
                    setFileDraft(fileName.replace(/\.pdf$/i, ''))
                    setRenamingFile(true)
                  }}
                >
                  Rename
                </button>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExportPdf} disabled={isExporting}>
              {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
              {isExporting ? 'Generating PDF' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ThemeSheet({ kind }: { kind: 'ruled' | 'color' | 'compact' }) {
  return (
    <div className="relative h-[52px] w-10 overflow-hidden rounded-[3px] bg-white shadow-sm" aria-hidden="true">
      {kind === 'color' && (
        <div className="flex h-[3px]">
          <span className="h-full flex-1 bg-band-pass" />
          <span className="h-full flex-1 bg-band-second-lower" />
          <span className="h-full flex-1 bg-band-second-upper" />
          <span className="h-full flex-1 bg-band-first" />
        </div>
      )}
      <div className={cn('space-y-[5px] px-1.5', kind === 'color' ? 'pt-2' : 'pt-2.5')}>
        <div className="h-[3px] w-5 rounded-full bg-neutral-800" />
        <div className="h-px w-full bg-neutral-300" />
        <div className="h-px w-full bg-neutral-200" />
        {kind !== 'compact' && <div className="h-px w-4/5 bg-neutral-200" />}
        {kind === 'ruled' && (
          <>
            <div className="h-px w-full bg-neutral-200" />
            <div className="h-px w-3/5 bg-neutral-200" />
          </>
        )}
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 py-3 text-left"
    >
      <span className="text-sm">{label}</span>
      <span
        className={cn(
          'relative h-[22px] w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-foreground' : 'bg-foreground/15',
        )}
      >
        <span
          className={cn(
            'absolute top-[2px] size-[18px] rounded-full transition-transform',
            checked ? 'translate-x-[20px] bg-background' : 'translate-x-[2px] bg-foreground/55',
          )}
        />
      </span>
    </button>
  )
}
