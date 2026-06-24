import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDegrees } from '@/hooks/useDegrees'
import { useCreatePreset } from '@/hooks/usePresets'
import { toast } from 'sonner'

export default function NewPresetPage() {
  const navigate = useNavigate()
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const createPreset = useCreatePreset()

  const [selectedDegreeId, setSelectedDegreeId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDegreeId || !title.trim()) return

    createPreset.mutate(
      { degreeId: selectedDegreeId, title, description, isPublic },
      {
        onSuccess: () => {
          toast.success("Template published successfully!")
          navigate('/presets/mine')
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to publish template.")
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 text-emerald-400 mb-6">
          <Button variant="ghost" className="p-0 hover:bg-transparent text-emerald-400 hover:text-emerald-300" onClick={() => navigate('/presets/mine')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to My Templates
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> Publish Template
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-2">
            Turn your degree structure into a template that others can clone.
          </p>
        </div>

        <Card className="bg-[#273449] border-[#1e3a5f] p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label className="text-slate-300 font-mono text-sm uppercase tracking-widest">Select Degree to Clone</Label>
              <Select value={selectedDegreeId} onValueChange={setSelectedDegreeId} disabled={isDegreesLoading}>
                <SelectTrigger className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono">
                  <SelectValue placeholder="Select one of your degrees..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono">
                  {degrees.map(deg => (
                    <SelectItem key={deg.id} value={deg.id} className="hover:bg-[#1e3a5f] focus:bg-[#1e3a5f] cursor-pointer">
                      {deg.title} {deg.institution ? `(${deg.institution})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 font-mono text-sm uppercase tracking-widest">Template Title</Label>
              <Input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. BSc Computer Science (2024)"
                className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 font-mono text-sm uppercase tracking-widest">Description (Optional)</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe the focus of this degree..."
                className="w-full rounded-md border border-[#1e3a5f] bg-[#1e293b] px-3 py-2 text-sm text-slate-100 font-mono min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#1e3a5f] pt-6">
              <div className="space-y-0.5">
                <Label className="text-slate-100 font-mono font-bold">Make Public</Label>
                <p className="text-slate-400 font-mono text-xs">
                  Allow anyone to discover this template in the community browser.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isPublic} 
                  onChange={e => setIsPublic(e.target.checked)} 
                />
                <div className="w-11 h-6 bg-[#1e3a5f] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#273449] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400"></div>
              </label>
            </div>

            <Button 
              type="submit"
              disabled={createPreset.isPending || !selectedDegreeId || !title.trim()}
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono text-sm uppercase tracking-widest mt-4"
            >
              {createPreset.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Generate Template Code'
              )}
            </Button>
          </form>
        </Card>

      </div>
    </div>
  )
}
