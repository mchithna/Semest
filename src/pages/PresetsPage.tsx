import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Globe, Users, FileText, ArrowRight, Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { usePublicPresets } from '@/hooks/usePresets'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function PresetsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { data: presets, isLoading } = usePublicPresets()
  const [searchQuery, setSearchQuery] = useState('')
  const [codeQuery, setCodeQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredPresets = useMemo(() => {
    if (!presets) return []
    if (!searchQuery.trim()) return presets
    const lowerQuery = searchQuery.trim().toLowerCase()
    return presets.filter(p => {
      const titleMatch = p.title ? p.title.toLowerCase().includes(lowerQuery) : false
      const instMatch = p.institution ? p.institution.toLowerCase().includes(lowerQuery) : false
      const descMatch = p.description ? p.description.toLowerCase().includes(lowerQuery) : false
      const codeMatch = p.code ? p.code.toLowerCase().includes(lowerQuery) : false
      return titleMatch || instMatch || descMatch || codeMatch
    })
  }, [presets, searchQuery])

  const handleCodeSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (codeQuery.trim().length === 6) {
      navigate(`/presets/${codeQuery.trim().toUpperCase()}`)
    }
  }

  const handleSharePreset = (e: React.MouseEvent, code: string) => {
    e.stopPropagation()
    const url = `${window.location.origin}/presets/${code}`
    navigator.clipboard.writeText(url)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
    toast.success(`Share link copied for preset ${code}!`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b pb-8">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-widest uppercase text-primary flex items-center gap-3">
              <Globe className="w-8 h-8" /> Community Presets
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-3 max-w-lg leading-relaxed">
              Discover degree structures published by the community. Find your major, clone the preset, and start tracking your GPA instantly.
            </p>
          </div>
          
          <form onSubmit={handleCodeSearch} className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Have a share code?
            </label>
            <div className="flex gap-2">
              <Input
                value={codeQuery}
                onChange={e => setCodeQuery(e.target.value.toUpperCase())}
                placeholder="e.g. X7K9M2"
                maxLength={6}
                className="bg-card border-border text-foreground font-mono w-full md:w-40"
              />
              <Button type="submit" disabled={codeQuery.trim().length !== 6} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold font-mono">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Search Bar & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, institution, or code..."
              className="pl-10 bg-card border-border text-foreground font-mono h-12"
            />
          </div>
          {session && (
            <Button 
              onClick={() => navigate('/presets/mine')}
              variant="outline"
              className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground font-bold font-mono uppercase tracking-widest h-12 transition-colors"
            >
              My Presets
            </Button>
          )}
        </div>

        {/* Presets Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 bg-muted rounded-xl" />
            ))}
          </div>
        ) : filteredPresets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed rounded-lg bg-card/30">
            <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-mono font-bold text-foreground mb-2">No presets found</h3>
            <p className="text-muted-foreground font-mono text-sm max-w-md">
              We couldn't find any public presets matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPresets.map((preset) => (
              <Card 
                key={preset.id} 
                className="bg-card border-border p-6 hover:border-primary/50 transition-all cursor-pointer flex flex-col group hover:shadow-lg hover:-translate-y-1 relative"
                onClick={() => navigate(`/presets/${preset.code}`)}
              >
                <div className="flex justify-between items-start mb-4 gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-mono font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {preset.title}
                    </h3>
                    <p className="text-sm font-mono text-muted-foreground mt-1 line-clamp-1">
                      {preset.institution || 'Unknown Institution'}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => handleSharePreset(e, preset.code)}
                    title="Copy Preset Link"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-muted"
                  >
                    {copiedCode === preset.code ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {preset.description && (
                  <p className="text-sm font-mono text-muted-foreground mb-6 line-clamp-3 flex-1">
                    {preset.description}
                  </p>
                )}

                <div className="mt-auto flex justify-between items-center text-xs font-mono text-muted-foreground border-t pt-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary/70" />
                    <span>{preset.use_count} clones</span>
                  </div>
                  <div className="bg-muted px-2 py-1 rounded font-bold">
                    {preset.code}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
