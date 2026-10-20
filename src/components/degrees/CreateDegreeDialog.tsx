import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
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
      toast.error(friendlyError(err, "Couldn't save the degree. Try again."))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[22px] border-border bg-card text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold">
            {initialData ? 'Edit degree' : 'New degree'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="degree-title">Title</Label>
            <Input
              id="degree-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BSc Computer Science"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree-institution">Institution</Label>
            <Input
              id="degree-institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. University of London"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree-start-year">Start year</Label>
            <Input
              id="degree-start-year"
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="e.g. 2024"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="degree-grade-scale">Grade scale</Label>
            <Select value={gradeScaleId} onValueChange={setGradeScaleId}>
              <SelectTrigger id="degree-grade-scale" className="w-full rounded-xl">
                <SelectValue placeholder="Select a scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {scales.map(scale => (
                  <SelectItem key={scale.id} value={scale.id}>
                    {scale.label} {scale.is_system ? '(System)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" aria-hidden="true" />}
              {isSaving ? 'Saving degree…' : 'Save degree'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
