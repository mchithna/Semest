import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'
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
      <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-sans font-semibold text-primary">
            {isReadOnly ? 'View grade scale' : initialData ? 'Edit grade scale' : 'New grade scale'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="scale-name" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Scale Name</Label>
            <Input
              id="scale-name"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Custom Scale"
              className="bg-card border-border text-foreground rounded-sm disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Grades</Label>
              {!isReadOnly && (
                <Button onClick={addRow} variant="outline" size="sm" className="h-7 px-2 border-border hover:bg-muted hover:text-primary text-muted-foreground rounded-sm">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              )}
            </div>

            <div className="border border-border rounded-sm bg-card overflow-hidden max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-mono text-xs uppercase h-8">Grade</TableHead>
                    <TableHead className="text-muted-foreground font-mono text-xs uppercase h-8">Points</TableHead>
                    {!isReadOnly && <TableHead className="w-[50px] h-8"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map((row, index) => (
                    <TableRow key={index} className="border-border hover:bg-muted/50">
                      <TableCell className="py-2">
                        <Input
                          value={row.grade}
                          onChange={(e) => updateRow(index, 'grade', e.target.value)}
                          className="h-8 bg-background border-border text-foreground rounded-sm disabled:opacity-75 disabled:cursor-not-allowed"
                          placeholder="A+"
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
                          className="h-8 bg-background border-border text-foreground rounded-sm disabled:opacity-75 disabled:cursor-not-allowed"
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {grades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground font-mono text-xs py-4">
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
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-sm text-xs"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </Button>
            {!isReadOnly && (
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm text-xs"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {isSaving ? 'Saving scale…' : 'Save scale'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
