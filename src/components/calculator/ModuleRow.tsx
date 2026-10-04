import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import type { GradeRow } from "@/lib/queries/gradeScales"
import { isUngradedGrade, UNGRADED_GRADE } from "@/lib/score"

export type ModuleData = {
  id: string
  name: string
  credits: number
  grade: string
}

type ModuleRowProps = {
  module: ModuleData
  gradeScale: GradeRow[]
  onChange: (id: string, field: keyof Omit<ModuleData, 'id'>, value: string | number) => void
  onRemove: (id: string) => void
}

export function ModuleRow({ module, gradeScale, onChange, onRemove }: ModuleRowProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 p-3 sm:p-0 border border-[#1e3a5f] sm:border-transparent rounded-md bg-[#1e293b]/50 sm:bg-transparent">
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
  )
}
