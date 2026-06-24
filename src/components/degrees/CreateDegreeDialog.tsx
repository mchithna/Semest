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
  onSave: (data: { title: string; institution: string | null; start_year: number | null; grade_scale_id: string | null }) => Promise<void>
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
      setStartYear(initialData?.start_year?.toString() ?? '')
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
        start_year: startYear ? parseInt(startYear, 10) : null,
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
      <DialogContent className="sm:max-w-[425px] bg-[#1e293b] border-[#1e3a5f] text-slate-100">
        <DialogHeader>
          <DialogTitle className="font-mono text-emerald-400 uppercase tracking-widest text-sm">
            {initialData ? 'Edit Degree' : 'New Degree'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Title <span className="text-rose-400">*</span></Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BSc Computer Science"
              className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Institution</Label>
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. University of London"
              className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Start Year</Label>
            <Input
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="e.g. 2024"
              className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase tracking-widest text-slate-400">Grade Scale</Label>
            <Select value={gradeScaleId} onValueChange={setGradeScaleId}>
              <SelectTrigger className="bg-[#273449] border-[#1e3a5f] text-slate-100 rounded-sm">
                <SelectValue placeholder="Select a scale" />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-[#1e3a5f] text-slate-100">
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
              className="border-[#1e3a5f] text-slate-300 hover:bg-[#273449] hover:text-white rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold rounded-sm font-mono text-xs uppercase tracking-widest"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Degree'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
