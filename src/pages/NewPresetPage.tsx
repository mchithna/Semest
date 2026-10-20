import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDegrees } from '@/hooks/useDegrees'
import { useCreatePreset } from '@/hooks/usePresets'
import { toast } from 'sonner'
import { friendlyError } from '@/lib/errors'

export default function NewPresetPage() {
  const navigate = useNavigate()
  const { degrees, isLoading: isDegreesLoading } = useDegrees()
  const createPreset = useCreatePreset()

  const [selectedDegreeId, setSelectedDegreeId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [institution, setInstitution] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const handleDegreeChange = (degId: string) => {
    setSelectedDegreeId(degId)
    const deg = degrees.find(d => d.id === degId)
    if (deg && deg.institution && !institution) {
      setInstitution(deg.institution)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDegreeId || !title.trim()) return

    createPreset.mutate(
      { degreeId: selectedDegreeId, title, description, institution, isPublic },
      {
        onSuccess: () => {
          toast.success('Preset published')
          navigate('/presets/mine')
        },
        onError: (err: any) => {
          toast.error(friendlyError(err, "Couldn't publish the preset. Try again."))
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>Publish a preset · Semest</title>
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Button variant="ghost" className="mb-4 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground" onClick={() => navigate('/presets/mine')}>
          Back to my presets
        </Button>
        <h1 className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">Publish a preset</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Turn a degree into a structure other people can clone.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-[22px] bg-card p-6 sm:p-8">
            
            <div className="space-y-2">
              <Label>Degree to publish</Label>
              <Select value={selectedDegreeId} onValueChange={handleDegreeChange} disabled={isDegreesLoading}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Select one of your degrees..." />
                </SelectTrigger>
                <SelectContent>
                  {degrees.map(deg => (
                    <SelectItem key={deg.id} value={deg.id} className="hover:bg-muted focus:bg-muted cursor-pointer">
                      {deg.title} {deg.institution ? `(${deg.institution})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Preset title</Label>
              <Input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. BSc Computer Science (2024)"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Institution (optional)</Label>
              <Input
                value={institution}
                onChange={e => setInstitution(e.target.value)}
                placeholder="e.g. University of Oxford"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe the focus of this degree..."
                className="min-h-[100px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
              <div className="space-y-0.5 pr-4">
                <Label>Make public</Label>
                <p className="text-muted-foreground text-xs">
                  Allow anyone to discover this preset in the community browser.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={isPublic} 
                  onChange={e => setIsPublic(e.target.checked)} 
                />
                <div className="h-6 w-11 rounded-full bg-muted peer-focus:outline-hidden after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-foreground/70 after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:bg-primary-foreground"></div>
              </label>
            </div>

            <Button 
              type="submit"
              disabled={createPreset.isPending || !selectedDegreeId || !title.trim()}
              className="mt-2 w-full"
            >
              {createPreset.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              {createPreset.isPending ? 'Generating preset…' : 'Generate preset code'}
            </Button>
          </form>
      </div>
    </div>
  )
}
