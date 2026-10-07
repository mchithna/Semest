import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import type { GradeRow } from "@/lib/queries/gradeScales"
import { isUngradedGrade, UNGRADED_GRADE } from "@/lib/score"
import { groupPriorModules, priorModuleLabel, type PriorModuleOption } from "@/lib/priorModules"

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
}

export function ModuleRow({ module, gradeScale, priorModules = [], onChange, onRemove }: ModuleRowProps) {
  const [pickingRetake, setPickingRetake] = useState(false)
  const options = priorModules.filter((prior) => prior.id !== module.id)
  const selected = options.find((prior) => prior.id === module.retakesModuleId)
  const showRetake = Boolean(module.retakesModuleId) || pickingRetake
  const groups = groupPriorModules(options, module.name)

  const clearRetake = () => {
    setPickingRetake(false)
    onChange(module.id, 'retakesModuleId', null)
  }

  return (
    <div className="flex flex-col gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 p-3 sm:p-0 border border-[#1e3a5f] sm:border-transparent rounded-md bg-[#1e293b]/50 sm:bg-transparent">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
        <div className="flex w-full sm:flex-1 gap-2 items-center">
          <Input
            value={module.name}
            onChange={(e) => onChange(module.id, 'name', e.target.value)}
            placeholder="Module Name"
            className="flex-1 min-w-[120px]"
          />
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onRemove(module.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex w-full sm:w-auto gap-2 items-center">
          <Input
            type="number"
            value={module.credits || ''}
            onChange={(e) => onChange(module.id, 'credits', parseFloat(e.target.value) || 0)}
            placeholder="Cr"
            className="w-[80px]"
            min={0.5}
            step={0.5}
          />
          <Select
            value={!module.grade || isUngradedGrade(module.grade) ? UNGRADED_GRADE : module.grade}
            onValueChange={(val) => onChange(module.id, 'grade', val)}
          >
            <SelectTrigger className="flex-1 sm:w-[120px]">
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
          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:inline-flex text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => onRemove(module.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {options.length > 0 && (
        showRetake ? (
          <div className="flex w-full flex-col gap-1">
            <div className="flex w-full items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">Replaces</span>
              <Select
                value={selected ? module.retakesModuleId ?? undefined : undefined}
                onValueChange={(val) => onChange(module.id, 'retakesModuleId', val)}
              >
                <SelectTrigger className="min-w-0 flex-1" aria-label="Earlier module this replaces">
                  <SelectValue placeholder="Choose the earlier module" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-72">
                  {groups.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.modules.map((prior) => (
                        <SelectItem key={prior.id} value={prior.id}>
                          {priorModuleLabel(prior)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground"
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
  )
}
