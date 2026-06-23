import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { GradeScale, GradeRow } from '@/lib/queries/gradeScales'

interface GradeScaleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: GradeScale
  onSave: (label: string, grades: GradeRow[]) => Promise<void>
}

export function GradeScaleEditor({
  open,
  onOpenChange,
  initialData,
  onSave,
}: GradeScaleEditorProps) {
  const [label, setLabel] = useState('')
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setLabel(initialData?.label ?? '')
      setGrades(initialData?.grades ?? [{ grade: 'A', points: 4.0 }])
    }
  }, [open, initialData])

  const addRow = () => {
    setGrades([...grades, { grade: '', points: 0 }])
  }

  const removeRow = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, field: keyof GradeRow, value: string | number) => {
    const newGrades = [...grades]
    newGrades[index] = { ...newGrades[index], [field]: value } as any
    setGrades(newGrades)
  }

  const handleSave = async () => {
    // Validation
    if (!label.trim()) return toast.error('Label is required')
    if (grades.length === 0) return toast.error('At least one grade is required')
    
    const uniqueGrades = new Set(grades.map(g => g.grade.trim()))
    if (uniqueGrades.size !== grades.length) return toast.error('Grade names must be unique')
    
    for (const g of grades) {
      if (!g.grade.trim()) return toast.error('Grade names cannot be empty')
      if (g.points < 0 || g.points > 4.5) return toast.error('Points must be between 0 and 4.5')
    }

    setIsSaving(true)
    try {
      await onSave(label, grades)
      onOpenChange(false)
      toast.success(initialData ? 'Scale updated' : 'Scale created')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1e293b] border-[#1e3a5f] text-slate-100">
        <DialogHeader>
          <DialogTitle className="font-mono text-emerald-400 uppercase tracking-widest text-sm">
            {initialData ? 'Edit Grade Scale' : 'New Grade Scale'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Scale Name</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Custom Scale"
              className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Grades</Label>
              <Button onClick={addRow} variant="outline" size="sm" className="h-7 px-2 border-[#1e3a5f] hover:bg-[#273449] hover:text-emerald-400 text-slate-400 rounded-sm">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            <div className="border border-[#1e3a5f] rounded-sm bg-[#273449] overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-[#1e293b] sticky top-0 z-10">
                  <TableRow className="border-[#1e3a5f] hover:bg-transparent">
                    <TableHead className="text-slate-400 font-mono text-xs uppercase h-8">Grade</TableHead>
                    <TableHead className="text-slate-400 font-mono text-xs uppercase h-8">Points</TableHead>
                    <TableHead className="w-[50px] h-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((row, index) => (
                    <TableRow key={index} className="border-[#1e3a5f] hover:bg-[#2a384d]">
                      <TableCell className="py-2">
                        <Input
                          value={row.grade}
                          onChange={(e) => updateRow(index, 'grade', e.target.value)}
                          className="h-8 bg-[#1e293b] border-[#1e3a5f] text-slate-100 rounded-sm"
                          placeholder="A+"
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="4.5"
                          value={row.points}
                          onChange={(e) => updateRow(index, 'points', parseFloat(e.target.value) || 0)}
                          className="h-8 bg-[#1e293b] border-[#1e3a5f] text-slate-100 rounded-sm"
                        />
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(index)}
                          className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-slate-500 font-mono text-xs py-4">
                        No grades added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#1e3a5f] text-slate-300 hover:bg-[#273449] hover:text-white rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Scale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
