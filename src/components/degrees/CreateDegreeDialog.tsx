import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGradeScales } from '@/hooks/useGradeScales'
import type { DegreeWithScale } from '@/lib/queries/degrees'

interface CreateDegreeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: DegreeWithScale
  onSave: (data: { title: string; institution: string | null; started_year: number | null; grade_scale_id: string | null }) => Promise<void>
}

export function CreateDegreeDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: CreateDegreeDialogProps) {
  const { scales } = useGradeScales()
  
  const [title, setTitle] = useState('')
  const [institution, setInstitution] = useState('')
  const [startYear, setStartYear] = useState('')
  const [gradeScaleId, setGradeScaleId] = useState('none')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(initialData?.title ?? '')
      setInstitution(initialData?.institution ?? '')
      setStartYear(initialData?.started_year?.toString() ?? '')
      setGradeScaleId(initialData?.grade_scale_id ?? 'none')
    }
  }, [open, initialData])

  const handleSave = async () => {
    if (!title.trim()) return toast.error('Title is required')
    
    setIsSaving(true)
    try {
      await onSave({
        title: title.trim(),
        institution: institution.trim() || null,
        started_year: startYear ? parseInt(startYear, 10) : null,
        grade_scale_id: gradeScaleId === 'none' ? null : gradeScaleId,
      })
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-mono text-primary uppercase tracking-widest text-sm">
            {initialData ? 'Edit Degree' : 'New Degree'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="degree-title" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Title <span className="text-destructive">*</span></Label>
            <Input
              id="degree-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BSc Computer Science"
              className="bg-background border-border text-foreground rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree-institution" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Institution</Label>
            <Input
              id="degree-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. University of London"
              className="bg-background border-border text-foreground rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree-start-year" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Start Year</Label>
            <Input
              id="degree-start-year"
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="e.g. 2024"
              className="bg-background border-border text-foreground rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree-grade-scale" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Grade Scale</Label>
            <Select value={gradeScaleId} onValueChange={setGradeScaleId}>
              <SelectTrigger id="degree-grade-scale" className="bg-background border-border text-foreground rounded-sm">
                <SelectValue placeholder="Select a scale" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="none">None</SelectItem>
                {scales.map(scale => (
                  <SelectItem key={scale.id} value={scale.id}>
                    {scale.label} {scale.is_system ? '(System)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {isSaving ? 'Saving degree…' : 'Save Degree'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
