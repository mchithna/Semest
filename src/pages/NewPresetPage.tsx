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
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto space-y-8 animate-slideUp">
        
        <div className="flex items-center gap-4 text-primary mb-6">
          <Button variant="ghost" className="p-0 hover:bg-transparent text-primary hover:text-primary/80" onClick={() => navigate('/presets/mine')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to My Templates
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6" /> Publish Template
          </h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            Turn your degree structure into a template that others can clone.
          </p>
        </div>

        <Card className="bg-card border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <Label className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Select Degree to Clone</Label>
              <Select value={selectedDegreeId} onValueChange={setSelectedDegreeId} disabled={isDegreesLoading}>
                <SelectTrigger className="bg-background border-border text-foreground font-mono">
                  <SelectValue placeholder="Select one of your degrees..." />
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground font-mono">
                  {degrees.map(deg => (
                    <SelectItem key={deg.id} value={deg.id} className="hover:bg-muted focus:bg-muted cursor-pointer">
                      {deg.title} {deg.institution ? `(${deg.institution})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Template Title</Label>
              <Input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. BSc Computer Science (2024)"
                className="bg-background border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground font-mono text-sm uppercase tracking-widest">Description (Optional)</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe the focus of this degree..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground font-mono min-h-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
              <div className="space-y-0.5 pr-4">
                <Label className="text-foreground font-mono font-bold">Make Public</Label>
                <p className="text-muted-foreground font-mono text-xs">
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
                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground/50 after:border-foreground/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <Button 
              type="submit"
              disabled={createPreset.isPending || !selectedDegreeId || !title.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono text-sm uppercase tracking-widest mt-4"
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
