import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
import { LIMITS } from '@/lib/limits'
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
  isReadOnly?: boolean
}

export function GradeScaleEditor({
  open,
  onOpenChange,
  initialData,
  onSave,
  isReadOnly = false,
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
    if (grades.length >= LIMITS.gradesPerScale) {
      toast.error(`A scale can have at most ${LIMITS.gradesPerScale} grades`)
      return
    }
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
    if (label.length > LIMITS.scaleLabel) return toast.error(`Scale name must be ${LIMITS.scaleLabel} characters or fewer`)
    if (grades.length === 0) return toast.error('At least one grade is required')
    if (grades.length > LIMITS.gradesPerScale) return toast.error(`A scale can have at most ${LIMITS.gradesPerScale} grades`)
    
    const uniqueGrades = new Set(grades.map(g => g.grade.trim()))
    if (uniqueGrades.size !== grades.length) return toast.error('Grade names must be unique')
    
    for (const g of grades) {
      if (!g.grade.trim()) return toast.error('Grade names cannot be empty')
      if (g.grade.length > LIMITS.scaleGrade) return toast.error(`Grade must be ${LIMITS.scaleGrade} characters or fewer`)
      if (g.points < 0 || g.points > 100) return toast.error('Points must be between 0 and 100')
    }

    setIsSaving(true)
    try {
      await onSave(label, grades)
      onOpenChange(false)
      toast.success(initialData ? 'Scale updated' : 'Scale created')
    } catch (err: any) {
      toast.error(friendlyError(err, "Couldn't save the scale. Try again."))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[22px] border-border bg-card text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">
            {isReadOnly ? 'View grade scale' : initialData ? 'Edit grade scale' : 'New grade scale'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="scale-name" className="text-sm text-muted-foreground">Scale name</Label>
            <Input
              id="scale-name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My custom scale"
              maxLength={LIMITS.scaleLabel}
              className="rounded-xl"
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">Grades</Label>
              {!isReadOnly && (
                <Button onClick={addRow} variant="outline" size="sm">
                  <Plus /> Add
                </Button>
              )}
            </div>

            <div className="max-h-[300px] overflow-hidden overflow-y-auto rounded-[22px] bg-background">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-muted-foreground">Grade</TableHead>
                    <TableHead className="h-8 text-muted-foreground">Points</TableHead>
                    {!isReadOnly && <TableHead className="h-8 w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="py-2">
                        <Input
                          value={row.grade}
                          onChange={(e) => updateRow(index, 'grade', e.target.value)}
                          className="h-8 rounded-xl"
                          placeholder="A+"
                          maxLength={LIMITS.scaleGrade}
                          disabled={isReadOnly}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={row.points}
                          onChange={(e) => updateRow(index, 'points', parseFloat(e.target.value) || 0)}
                          className="h-8 rounded-xl"
                          disabled={isReadOnly}
                        />
                      </TableCell>
                      {!isReadOnly && (
                        <TableCell className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove grade ${row.grade}`}
                            onClick={() => removeRow(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-4 text-center text-sm text-muted-foreground">
                        No grades added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
                {isSaving ? 'Saving scale…' : 'Save scale'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
