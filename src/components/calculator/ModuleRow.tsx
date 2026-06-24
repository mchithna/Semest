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
    <div className="flex items-center gap-2 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Input
        value={module.name}
        onChange={(e) => onChange(module.id, 'name', e.target.value)}
        placeholder="Module Name"
        className="flex-1 min-w-[120px]"
      />
      <Input
        type="number"
        value={module.credits || ''}
        onChange={(e) => onChange(module.id, 'credits', parseFloat(e.target.value) || 0)}
        placeholder="Cr"
        className="w-[80px]"
        min={0}
        step={0.5}
      />
      <Select
        value={module.grade}
        onValueChange={(val) => onChange(module.id, 'grade', val)}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Grade" />
        </SelectTrigger>
        <SelectContent>
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
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(module.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}
