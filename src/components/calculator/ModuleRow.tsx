import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import type { GradeRow } from "@/lib/queries/gradeScales"
import { isUngradedGrade, UNGRADED_GRADE } from "@/lib/score"
import { priorSemesterKey, priorSemesters, type PriorModuleOption } from "@/lib/priorModules"
import { prefersReducedMotion } from "@/lib/motion"
import { cn } from "@/lib/utils"

export type { PriorModuleOption }

export type ModuleData = {
  id: string
  name: string
  credits: number
  grade: string
  retakesModuleId?: string | null
}

type ModuleRowProps = {
  module: ModuleData
  gradeScale: GradeRow[]
  priorModules?: PriorModuleOption[]
  onChange: (id: string, field: keyof Omit<ModuleData, 'id'>, value: string | number | null) => void
  onRemove: (id: string) => void
  /** Play the open animation. Existing rows stay still. */
  enter?: boolean
}

const ROW_MS = 180

export function ModuleRow({ module, gradeScale, priorModules = [], onChange, onRemove, enter = false }: ModuleRowProps) {
  const [pickingRetake, setPickingRetake] = useState(false)
  const [semesterChoice, setSemesterChoice] = useState<string | null>(null)
  const options = priorModules.filter((prior) => prior.id !== module.id)
  const selected = options.find((prior) => prior.id === module.retakesModuleId)
  const showRetake = Boolean(module.retakesModuleId) || pickingRetake
  const semesters = priorSemesters(options)
  const activeSemester = semesterChoice ?? (selected ? priorSemesterKey(selected) : null)
  const semesterModules = activeSemester
    ? options.filter((prior) => priorSemesterKey(prior) === activeSemester)
    : []

  const clearRetake = () => {
    setPickingRetake(false)
    setSemesterChoice(null)
    onChange(module.id, 'retakesModuleId', null)
  }

  const chooseSemester = (key: string) => {
    setSemesterChoice(key)
    if (!selected || priorSemesterKey(selected) !== key) {
      onChange(module.id, 'retakesModuleId', null)
    }
  }

  const removeLabel = module.name.trim() ? `Delete ${module.name.trim()}` : 'Delete module'
  const [open, setOpen] = useState(!enter || prefersReducedMotion())
  const [leaving, setLeaving] = useState(false)
  const removeTimer = useRef<number | null>(null)

  useEffect(() => {
    if (!enter || prefersReducedMotion()) return
    const frame = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [enter])

  useEffect(() => () => {
    if (removeTimer.current !== null) window.clearTimeout(removeTimer.current)
  }, [])

  const requestRemove = () => {
    if (leaving) return
    if (prefersReducedMotion()) {
      onRemove(module.id)
      return
    }
    setLeaving(true)
    removeTimer.current = window.setTimeout(() => onRemove(module.id), ROW_MS)
  }

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-[180ms] ease-out',
        open && !leaving ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
      )}
    >
    <div className={cn('flex min-h-0 w-full flex-col gap-2 overflow-hidden', leaving && 'pointer-events-none')}>
      <div className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_5.5rem_8.5rem_2.25rem] sm:items-center">
        <div className="flex items-center gap-2 sm:contents">
          <Input
            value={module.name}
            onChange={(e) => onChange(module.id, 'name', e.target.value)}
            placeholder="Module name"
            aria-label="Module name"
            className="min-w-0 flex-1 rounded-xl"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:hidden"
            aria-label={removeLabel}
            onClick={requestRemove}
          >
            <X />
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:contents">
          <Input
            type="number"
            value={module.credits || ''}
            onChange={(e) => onChange(module.id, 'credits', parseFloat(e.target.value) || 0)}
            placeholder="Credits"
            aria-label="Credits"
            className="w-24 rounded-xl sm:w-auto"
            min={0.5}
            step={0.5}
          />
          <Select
            value={!module.grade || isUngradedGrade(module.grade) ? UNGRADED_GRADE : module.grade}
            onValueChange={(val) => onChange(module.id, 'grade', val)}
          >
            <SelectTrigger className="min-w-0 flex-1 rounded-xl sm:w-full" aria-label="Grade">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNGRADED_GRADE}>Not graded</SelectItem>
              {gradeScale.map((row) => (
                <SelectItem key={row.grade} value={row.grade}>
                  {row.grade} ({row.points})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="hidden text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:inline-flex"
          aria-label={removeLabel}
          onClick={requestRemove}
        >
          <X />
        </Button>
      </div>

      {options.length > 0 && (
        showRetake ? (
          <div className="flex w-full flex-col gap-1">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <span className="shrink-0 text-xs text-muted-foreground">Replaces</span>
              <Select
                value={activeSemester ?? ''}
                onValueChange={chooseSemester}
              >
                <SelectTrigger className="min-w-0 w-full sm:flex-1" aria-label="Semester this replaces">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {semesters.map((semester) => (
                    <SelectItem key={semester.key} value={semester.key}>
                      {semester.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selected && activeSemester === priorSemesterKey(selected) ? selected.id : ''}
                onValueChange={(val) => onChange(module.id, 'retakesModuleId', val)}
                disabled={!activeSemester}
              >
                <SelectTrigger
                  className="min-w-0 w-full sm:flex-1"
                  aria-label="Module this replaces"
                  title={activeSemester ? undefined : 'Choose a semester first'}
                >
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {semesterModules.map((prior) => (
                    <SelectItem key={prior.id} value={prior.id}>
                      {prior.name.trim() || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 self-end text-muted-foreground sm:self-auto"
                onClick={clearRetake}
              >
                Clear
              </Button>
            </div>
            {module.retakesModuleId && !selected && (
              <p className="text-xs text-muted-foreground">The saved retake is not an earlier module. Choose one, or clear it.</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="self-start text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => setPickingRetake(true)}
          >
            Mark as retake
          </button>
        )
      )}
    </div>
    </div>
  )
}
