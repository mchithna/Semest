import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, Globe, Users, FileText, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePublicPresets } from '@/hooks/usePresets'

export default function PresetsPage() {
  const navigate = useNavigate()
  const { data: presets, isLoading } = usePublicPresets()
  const [searchQuery, setSearchQuery] = useState('')
  const [codeQuery, setCodeQuery] = useState('')

  const filteredPresets = useMemo(() => {
    if (!presets) return []
    if (!searchQuery.trim()) return presets
    const lowerQuery = searchQuery.toLowerCase()
    return presets.filter(p => 
      p.title.toLowerCase().includes(lowerQuery) || 
      (p.institution && p.institution.toLowerCase().includes(lowerQuery)) ||
      (p.description && p.description.toLowerCase().includes(lowerQuery))
    )
  }, [presets, searchQuery])

  const handleCodeSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (codeQuery.trim().length === 6) {
      navigate(`/presets/${codeQuery.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#1e3a5f] pb-8">
          <div>
            <h1 className="text-3xl font-mono font-bold tracking-widest uppercase text-emerald-400 flex items-center gap-3">
              <Globe className="w-8 h-8" /> Community Templates
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-3 max-w-lg leading-relaxed">
              Discover degree structures published by the community. Find your major, clone the template, and start tracking your GPA instantly.
            </p>
          </div>
          
          <form onSubmit={handleCodeSearch} className="flex flex-col gap-2 w-full md:w-auto">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Have a share code?
            </label>
            <div className="flex gap-2">
              <Input
                value={codeQuery}
                onChange={e => setCodeQuery(e.target.value.toUpperCase())}
                placeholder="e.g. X7K9M2"
                maxLength={6}
                className="bg-[#273449] border-[#1e3a5f] text-slate-100 font-mono w-full md:w-40"
              />
              <Button type="submit" disabled={codeQuery.trim().length !== 6} className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, institution..."
            className="pl-10 bg-[#273449] border-[#1e3a5f] text-slate-100 font-mono h-12"
          />
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
          </div>
        ) : filteredPresets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-[#1e3a5f] rounded-lg bg-[#273449]/30">
            <FileText className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <h3 className="text-lg font-mono font-bold text-slate-100 mb-2">No templates found</h3>
            <p className="text-slate-400 font-mono text-sm max-w-md">
              We couldn't find any public templates matching your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPresets.map((preset) => (
              <Card 
                key={preset.id} 
                className="bg-[#273449] border-[#1e3a5f] p-6 hover:border-emerald-400/50 transition-all cursor-pointer flex flex-col group hover:shadow-lg hover:shadow-emerald-400/5"
                onClick={() => navigate(`/presets/${preset.code}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {preset.title}
                    </h3>
                    <p className="text-sm font-mono text-slate-400 mt-1 line-clamp-1">
                      {preset.institution || 'Unknown Institution'}
                    </p>
                  </div>
                </div>
                
                {preset.description && (
                  <p className="text-sm font-mono text-slate-300 mb-6 line-clamp-3 flex-1">
                    {preset.description}
                  </p>
                )}

                <div className="mt-auto flex justify-between items-center text-xs font-mono text-slate-400 border-t border-[#1e3a5f] pt-4">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400/70" />
                    <span>{preset.use_count} clones</span>
                  </div>
                  <div className="bg-[#1e3a5f] px-2 py-1 rounded font-bold">
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
