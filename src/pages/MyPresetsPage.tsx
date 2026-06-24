import { useNavigate } from 'react-router-dom'
import { Plus, BookTemplate, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMyPresets } from '@/hooks/usePresets'

export default function MyPresetsPage() {
  const navigate = useNavigate()
  const { data: presets, isLoading } = useMyPresets()

  return (
    <div className="min-h-screen bg-[#1e293b] text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 text-emerald-400 mb-6">
          <Button variant="ghost" className="p-0 hover:bg-transparent text-emerald-400 hover:text-emerald-300" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-[#1e3a5f] pb-6">
          <div>
            <h1 className="text-2xl font-mono font-bold tracking-widest uppercase text-emerald-400">
              My Published Templates
            </h1>
            <p className="text-slate-400 font-mono text-sm mt-2">
              Manage the degrees you have shared with the community.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/presets/new')}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4 mr-2" />
            Publish New Template
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        ) : !presets || presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[#1e3a5f] rounded-lg bg-[#273449]/30">
            <BookTemplate className="w-12 h-12 text-slate-500 mb-4 opacity-50" />
            <h3 className="text-lg font-mono font-bold text-slate-100 mb-2">No templates published</h3>
            <p className="text-slate-400 font-mono text-sm max-w-md">
              You haven't published any of your degrees as templates yet. Share your degree structure with others!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {presets.map((preset) => (
              <Card key={preset.id} className="bg-[#273449] border-[#1e3a5f] p-6 hover:border-emerald-400/50 transition-colors flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-mono font-bold text-slate-100">{preset.title}</h3>
                    <p className="text-sm font-mono text-slate-400">{preset.institution || 'No Institution'}</p>
                  </div>
                  <div className="bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded font-mono text-xs font-bold">
                    {preset.code}
                  </div>
                </div>
                
                {preset.description && (
                  <p className="text-sm font-mono text-slate-300 mb-6 line-clamp-2 flex-1">
                    {preset.description}
                  </p>
                )}

                <div className="mt-auto flex justify-between items-center text-xs font-mono text-slate-400 border-t border-[#1e3a5f] pt-4">
                  <span className={preset.is_public ? 'text-emerald-400' : 'text-slate-500'}>
                    {preset.is_public ? 'Public' : 'Private'}
                  </span>
                  <span>{preset.use_count} uses</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
