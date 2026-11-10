import { useEffect, useId, useRef, useState } from 'react'
import { Download, Loader2, Lock, X } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { toPng } from 'html-to-image'
import { toast } from 'sonner'
import { bandsForScale, classBandsOf } from '@/lib/bands'
import { friendlyError } from '@/lib/errors'
import { NIGHT, SOCIAL_PX } from '@/lib/export/palette'
import { PAGE_PT } from '@/lib/export/layout'
import { socialFontCss, waitForExportFonts } from '@/lib/export/fontEmbed'
import { loadIdentity, loadOverrides, saveIdentity, saveOverrides, type ThemeOverrides } from '@/lib/export/preferences'
import {
  buildReport,
  outputExtension,
  pageCountLabel,
  reportFileName,
  type PaperSize,
  type ReportModel,
  type SocialAspect,
} from '@/lib/export/reportModel'
import {
  defaultPaper,
  OPTION_LABELS,
  resolveToggles,
  THEME_ORDER,
  THEMES,
  type OptionKey,
  type ThemeId,
} from '@/lib/export/themes'
import type { DegreeWithScale } from '@/lib/queries/degrees'
import type { SemesterWithModules } from '@/lib/queries/semesters'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FormalReport } from './FormalReport'
import { FormalPdf, RulerPdf } from './ReportPdf'
import { RulerReport } from './RulerReport'
import { SocialCard } from './SocialCard'

type ExportReportModalProps = {
  isOpen: boolean
  onClose: () => void
  degree: DegreeWithScale | undefined
  semesters: SemesterWithModules[]
  defaultStudentName?: string
  targetCgpa?: number | null
}

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E6E9F7]'

export function ExportReportModal({
  isOpen,
  onClose,
  degree,
  semesters,
  defaultStudentName = '',
  targetCgpa = null,
}: ExportReportModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const pngRef = useRef<HTMLElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const titleEdited = useRef(false)
  const fileTouched = useRef(false)
  const [theme, setTheme] = useState<ThemeId>('formal')
  const [paper, setPaper] = useState<PaperSize>(() => defaultPaper())
  const [aspect, setAspect] = useState<SocialAspect>('4:5')
  const [title, setTitle] = useState('')
  const [studentName, setStudentName] = useState(() => loadIdentity().studentName || defaultStudentName)
  const [studentId, setStudentId] = useState(() => loadIdentity().studentId)
  const [overrides, setOverrides] = useState<ThemeOverrides>(() => loadOverrides())
  const [pageIndex, setPageIndex] = useState(0)
  const [tab, setTab] = useState<'options' | 'preview'>('options')
  const [compact, setCompact] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [fileDraft, setFileDraft] = useState('')
  const [fileName, setFileName] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-height: 640px), (max-width: 900px)')
    const apply = () => setCompact(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const identity = loadIdentity()
    setStudentName((current) => current || identity.studentName || defaultStudentName)
    setStudentId((current) => current || identity.studentId)
    setOverrides(loadOverrides())
    const dialog = dialogRef.current
    const focusable = dialog?.querySelector<HTMLElement>('button, input')
    focusable?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const nodes = [...dialog.querySelectorAll<HTMLElement>('button, input, [href], [tabindex]:not([tabindex="-1"])')].filter(
        (node) => !node.hasAttribute('disabled'),
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      returnFocus.current?.focus()
    }
  }, [isOpen, defaultStudentName])

  useEffect(() => {
    if (!degree || titleEdited.current) return
    setTitle(`${degree.title} Academic Transcript`)
  }, [degree, isOpen])

  useEffect(() => {
    saveIdentity({ studentName, studentId })
  }, [studentName, studentId])

  useEffect(() => {
    saveOverrides(overrides)
  }, [overrides])

  const hasClassBands = bandsForScale(degree?.grade_scale?.grades ?? [], classBandsOf(degree)).bands.some((band) => band.tone !== 'plain')
  const resolved = resolveToggles(theme, overrides[theme], hasClassBands)
  const model =
    degree == null
      ? null
      : buildReport({
          degree,
          semesters,
          theme,
          toggles: resolved.values,
          title,
          studentName,
          studentId,
          paper,
          aspect,
          targetCgpa,
        })

  if (!isOpen || !degree || !model) return null

  const safePage = Math.min(pageIndex, Math.max(model.pages.length - 1, 0))
  const extension = outputExtension(theme)
  const autoName = reportFileName(studentName, degree.title, extension)
  const displayName = fileTouched.current ? fileName.replace(/\.(pdf|png)$/i, `.${extension}`) : autoName
  const missingIdentity = theme === 'formal' && (!studentName.trim() || !studentId.trim())
  const noGrades = model.gradedSemesterCount === 0
  const downloadBlocked = missingIdentity || noGrades
  const gradedLabel = `${degree.title}, ${model.gradedSemesterCount} graded ${model.gradedSemesterCount === 1 ? 'semester' : 'semesters'}`

  const setToggle = (key: OptionKey, value: boolean) => {
    setOverrides((current) => ({
      ...current,
      [theme]: { ...current[theme], [key]: value },
    }))
  }

  const commitFileName = () => {
    fileTouched.current = true
    const slug = fileDraft
      .trim()
      .replace(/\.(pdf|png)$/i, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
    setFileName(`${slug || (extension === 'png' ? 'card' : 'transcript')}.${extension}`)
    setRenaming(false)
  }

  const download = async () => {
    if (downloadBlocked) return
    try {
      setExporting(true)
      if (extension === 'png') {
        if (!pngRef.current) throw new Error('The card is not ready yet.')
        const size = SOCIAL_PX[aspect]
        await waitForExportFonts()
        const dataUrl = await toPng(pngRef.current, {
          pixelRatio: 1,
          width: size.width,
          height: size.height,
          canvasWidth: size.width,
          canvasHeight: size.height,
          backgroundColor: NIGHT,
          fontEmbedCSS: await socialFontCss(),
          style: { margin: '0', transform: 'none' },
        })
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = displayName
        link.click()
      } else {
        const documentTree = theme === 'ruler' ? <RulerPdf model={model} /> : <FormalPdf model={model} />
        const blob = await pdf(documentTree).toBlob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = displayName
        link.click()
        URL.revokeObjectURL(url)
      }
      toast.success(extension === 'png' ? 'Image downloaded' : 'PDF downloaded')
      onClose()
    } catch (error) {
      console.error(error)
      toast.error(friendlyError(error, "Couldn't create the file. Try again."))
    } finally {
      setExporting(false)
    }
  }

  const showOptions = !compact || tab === 'options'
  const showPreview = !compact || tab === 'preview'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="animate-export-fade absolute inset-0 bg-black/70" />
      <div className="pointer-events-none fixed top-0 -left-[20000px]" aria-hidden="true">
        {theme === 'social' && <SocialCard ref={pngRef} model={model} />}
      </div>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'animate-export-rise relative z-10 flex w-full flex-col overflow-hidden bg-[#171B3A] text-[#E6E9F7] shadow-2xl',
          compact ? 'fixed inset-0 h-auto rounded-none' : 'h-[min(700px,calc(100vh-48px))] max-w-[1060px] rounded-[28px]',
        )}
      >
        <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <h2 id={titleId} className="font-display text-[22px] font-semibold tracking-tight">
              Export report
            </h2>
            <p className="truncate text-sm text-[#A3AAD1]">{gradedLabel}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className={cn('flex size-11 items-center justify-center rounded-full border border-[rgba(230,233,247,0.16)]', focusRing)}>
            <X className="size-4" />
          </button>
        </header>

        {compact && (
          <div className="flex gap-2 px-6 pb-3" role="tablist" aria-label="Export report">
            {(['options', 'preview'] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={cn(
                  'h-11 rounded-full px-4 text-sm',
                  focusRing,
                  tab === item ? 'bg-[#E6E9F7] text-[#10132A]' : 'text-[#A3AAD1]',
                )}
              >
                {item === 'options' ? 'Options' : 'Preview'}
              </button>
            ))}
          </div>
        )}

        <div className={cn('grid min-h-0 flex-1', !compact && 'grid-cols-[minmax(0,1fr)_330px]')}>
          {showOptions && (
            <div className={cn('min-h-0 px-6 pb-2', compact ? 'overflow-y-auto' : 'overflow-hidden')}>
              <p className="text-sm text-[#A3AAD1]">Theme</p>
              <div role="radiogroup" aria-label="Theme" className="mt-1.5 grid grid-cols-3 gap-2">
                {THEME_ORDER.map((id) => {
                  const item = THEMES[id]
                  const selected = theme === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setTheme(id)
                        setPageIndex(0)
                      }}
                      className={cn(
                        'flex h-14 items-center gap-2 rounded-2xl border px-3 text-left',
                        focusRing,
                        selected ? 'border-[1.5px] border-[#E6E9F7] bg-[#222848]' : 'border-[rgba(230,233,247,0.16)] bg-[#10132A]',
                      )}
                    >
                      <ThemeThumb theme={id} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        <span className="block text-xs text-[#A3AAD1]">{item.outputLabel}</span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <label className="mt-3 block text-sm" htmlFor="export-title">
                Document title
              </label>
              <input
                id="export-title"
                value={title}
                onChange={(event) => {
                  titleEdited.current = true
                  setTitle(event.target.value)
                }}
                className={cn('mt-1.5 h-11 w-full rounded-xl border border-[rgba(230,233,247,0.16)] bg-[#10132A] px-3 text-sm', focusRing)}
              />

              <div className="mt-2 grid grid-cols-2 gap-3">
                <Field
                  id="export-name"
                  label="Student name"
                  value={studentName}
                  placeholder="Alex Morgan"
                  invalid={theme === 'formal' && !studentName.trim()}
                  message="Required for a formal report."
                  onChange={setStudentName}
                />
                <Field
                  id="export-id"
                  label="Student ID"
                  value={studentId}
                  placeholder="CS26-0142"
                  invalid={theme === 'formal' && !studentId.trim()}
                  message="Required for a formal report."
                  onChange={setStudentId}
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm">Show in document</p>
                <button
                  type="button"
                  className={cn('text-sm underline underline-offset-2', focusRing)}
                  onClick={() => setOverrides((current) => ({ ...current, [theme]: {} }))}
                >
                  Reset to defaults
                </button>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-x-6">
                {resolved.visible.map((key) => {
                  const locked = resolved.locked.includes(key)
                  const disabled = resolved.disabled.includes(key)
                  return (
                    <SwitchRow
                      key={key}
                      label={OPTION_LABELS[key]}
                      checked={resolved.values[key]}
                      locked={locked}
                      disabled={disabled}
                      hint={
                        locked
                          ? 'Required for this theme'
                          : disabled
                            ? 'This grade scale has no class bands'
                            : undefined
                      }
                      onChange={(value) => setToggle(key, value)}
                    />
                  )
                })}
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                {theme === 'social' ? (
                  <Segmented
                    label="Shape"
                    value={aspect}
                    options={[
                      ['1:1', '1:1'],
                      ['4:5', '4:5'],
                      ['9:16', '9:16'],
                    ]}
                    onChange={(value) => setAspect(value as SocialAspect)}
                  />
                ) : (
                  <Segmented
                    label="Paper"
                    value={paper}
                    options={[
                      ['A4', 'A4'],
                      ['LETTER', 'Letter'],
                    ]}
                    onChange={(value) => {
                      setPaper(value as PaperSize)
                      setPageIndex(0)
                    }}
                  />
                )}
                <p className="text-sm text-[#A3AAD1]">{pageCountLabel(model)}</p>
              </div>
              {noGrades && <p className="mt-2 text-sm text-[#F07A5A]">Add graded modules before exporting.</p>}
            </div>
          )}

          {showPreview && (
            <div className={cn('flex min-h-0 flex-col bg-[#10132A] p-3', compact ? 'mx-6 mb-3 rounded-[22px]' : 'm-3 rounded-[22px]')}>
              <div className="mb-2 flex h-8 items-center justify-between gap-2">
                <p className="text-sm font-medium">Preview</p>
                <div className="flex items-center gap-1 text-xs text-[#A3AAD1]">
                  {model.pages.length > 1 && (
                    <button type="button" className={cn('size-7 rounded-full', focusRing)} aria-label="Previous page" disabled={safePage === 0} onClick={() => setPageIndex(safePage - 1)}>
                      ‹
                    </button>
                  )}
                  <span>
                    {theme === 'social' ? aspect : paper === 'LETTER' ? 'Letter' : 'A4'}, page {safePage + 1} of {model.pages.length}
                  </span>
                  {model.pages.length > 1 && (
                    <button
                      type="button"
                      className={cn('size-7 rounded-full', focusRing)}
                      aria-label="Next page"
                      disabled={safePage >= model.pages.length - 1}
                      onClick={() => setPageIndex(safePage + 1)}
                    >
                      ›
                    </button>
                  )}
                </div>
              </div>
              <ScaledPreview model={model} pageIndex={safePage} />
            </div>
          )}
        </div>

        <footer className="flex h-[72px] shrink-0 items-center justify-between gap-3 bg-[#141836] px-6">
          <div className="min-w-0 text-sm text-[#A3AAD1]">
            {renaming ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  commitFileName()
                }}
              >
                <span>Saves as</span>
                <input
                  autoFocus
                  aria-label="File name"
                  value={fileDraft}
                  onChange={(event) => setFileDraft(event.target.value)}
                  onBlur={commitFileName}
                  className={cn('h-9 w-52 rounded-xl border border-[rgba(230,233,247,0.16)] bg-[#10132A] px-3 text-sm text-[#E6E9F7]', focusRing)}
                />
              </form>
            ) : (
              <p className="truncate">
                Saves as <span className="text-[#E6E9F7]">{displayName}</span>{' '}
                <button
                  type="button"
                  className={cn('text-[#E6E9F7] underline underline-offset-2', focusRing)}
                  onClick={() => {
                    setFileDraft(displayName.replace(/\.(pdf|png)$/i, ''))
                    setRenaming(true)
                  }}
                >
                  Rename
                </button>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={download} disabled={exporting || downloadBlocked}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              {extension === 'png' ? 'Download PNG' : 'Download PDF'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function ScaledPreview({ model, pageIndex }: { model: ReportModel; pageIndex: number }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ width: 280, height: 420 })

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const measure = () => setBox({ width: node.clientWidth, height: Math.max(node.clientHeight, 1) })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const paper = PAGE_PT[model.paper]
  const full = model.theme === 'social' ? SOCIAL_PX[model.aspect] : { width: (paper.width * 4) / 3, height: (paper.height * 4) / 3 }
  const scale = Math.min(box.width / full.width, box.height / full.height)

  return (
    <div ref={frameRef} className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div style={{ width: full.width * scale, height: full.height * scale }}>
        <div style={{ width: full.width, height: full.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {model.theme === 'formal' && <FormalReport model={model} pageIndex={pageIndex} />}
          {model.theme === 'ruler' && <RulerReport model={model} pageIndex={pageIndex} />}
          {model.theme === 'social' && <SocialCard model={model} />}
        </div>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  placeholder,
  invalid,
  message,
  onChange,
}: {
  id: string
  label: string
  value: string
  placeholder: string
  invalid: boolean
  message: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'mt-1.5 h-11 w-full rounded-xl border bg-[#10132A] px-3 text-sm placeholder:text-[#6E759C]',
          focusRing,
          invalid ? 'border-[#F07A5A]' : 'border-[rgba(230,233,247,0.16)]',
        )}
      />
      {invalid && <p className="mt-1 text-xs text-[#F07A5A]">{message}</p>}
    </div>
  )
}

function SwitchRow({
  label,
  checked,
  locked,
  disabled,
  hint,
  onChange,
}: {
  label: string
  checked: boolean
  locked: boolean
  disabled: boolean
  hint?: string
  onChange: (value: boolean) => void
}) {
  const blocked = locked || disabled
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={blocked}
      title={hint}
      onClick={() => {
        if (!blocked) onChange(!checked)
      }}
      className={cn(
        'flex h-11 items-center justify-between gap-3 border-b border-[rgba(230,233,247,0.14)] text-left text-sm',
        focusRing,
      )}
    >
      <span className={cn('flex items-center gap-1.5', blocked && 'text-[#A3AAD1]')}>
        {label}
        {locked && <Lock className="size-3" aria-label="Required for this theme" />}
      </span>
      <span className={cn('relative h-[22px] w-10 shrink-0 rounded-full', checked ? 'bg-[#E6E9F7]' : 'bg-[rgba(230,233,247,0.18)]')}>
        <span className={cn('absolute top-[2px] size-[18px] rounded-full bg-[#10132A]', checked ? 'translate-x-[20px]' : 'translate-x-[2px]')} />
      </span>
    </button>
  )
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex rounded-full bg-[#10132A] p-1">
        {options.map(([id, text]) => {
          const selected = value === id
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(id)}
              className={cn('h-8 rounded-full px-3 text-sm', focusRing, selected ? 'bg-[#E6E9F7] text-[#10132A]' : 'text-[#A3AAD1]')}
            >
              {text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ThemeThumb({ theme }: { theme: ThemeId }) {
  return (
    <span className="relative h-9 w-7 shrink-0 overflow-hidden rounded-[3px] bg-white" aria-hidden="true">
      {theme === 'social' && <span className="absolute inset-0 bg-[#10132A]" />}
      {theme === 'ruler' && <span className="absolute top-3 right-1 left-1 h-1 rounded-full bg-[#B9C0FF]" />}
      <span className={cn('absolute right-1 left-1 space-y-1', theme === 'social' ? 'top-2' : 'top-1.5')}>
        <span className={cn('block h-[3px] w-4 rounded-full', theme === 'social' ? 'bg-white' : 'bg-neutral-800')} />
        <span className={cn('block h-px w-full', theme === 'social' ? 'bg-white/40' : 'bg-neutral-300')} />
        <span className={cn('block h-px w-4/5', theme === 'social' ? 'bg-white/30' : 'bg-neutral-200')} />
      </span>
    </span>
  )
}
