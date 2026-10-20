import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePublicPresets } from '@/hooks/usePresets'
import { useAuth } from '@/context/AuthContext'
import { cardAccentClass } from '@/components/ruler/tone'
import { toast } from 'sonner'

export default function PresetsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [codeQuery, setCodeQuery] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = usePublicPresets(searchQuery)
  const filteredPresets = data?.pages.flatMap((page) => page.presets) ?? []

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
    toast.success('Share link copied')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <title>Presets · Semest</title>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="max-w-xl font-display text-5xl font-semibold tracking-tight sm:text-6xl">
              Community presets
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Find your major, clone the preset, and start tracking your GPA straight away.
            </p>
          </div>
          <form onSubmit={handleCodeSearch} className="flex flex-col gap-2">
            <label htmlFor="share-code" className="text-sm text-muted-foreground">
              Have a share code?
            </label>
            <div className="flex gap-2">
              <Input
                id="share-code"
                value={codeQuery}
                onChange={(event) => setCodeQuery(event.target.value.toUpperCase())}
                placeholder="e.g. X7R9M2"
                maxLength={6}
                className="w-40 rounded-full"
              />
              <Button type="submit" disabled={codeQuery.trim().length !== 6}>
                Go
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by title, institution or code"
              aria-label="Search presets"
              className="h-10 rounded-full pl-9"
            />
          </div>
          {session && (
            <Button variant="outline" onClick={() => navigate('/presets/mine')}>
              My presets
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-[22px] bg-muted" />
            ))}
          </div>
        ) : filteredPresets.length === 0 ? (
          <div className="mt-10 rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center">
            <h2 className="font-display text-2xl font-semibold tracking-tight">No presets found</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Nothing public matches that search.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPresets.map((preset, index) => (
              <article key={preset.id} className="flex h-full flex-col overflow-hidden rounded-[22px] bg-card">
                <div className={`h-[3px] shrink-0 ${cardAccentClass(index)}`} aria-hidden="true" />
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-semibold">{preset.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {preset.institution?.trim() || 'Unknown institution'}
                  </p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {preset.use_count} {preset.use_count === 1 ? 'clone' : 'clones'}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <button
                      type="button"
                      onClick={(event) => handleSharePreset(event, preset.code)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs tracking-wide text-foreground"
                      aria-label={copiedCode === preset.code ? 'Share link copied' : `Copy share link for ${preset.code}`}
                    >
                      {copiedCode === preset.code && <Check className="size-3" />}
                      {preset.code}
                    </button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/presets/${preset.code}`)}>
                      Use preset
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="mt-8 flex justify-center">
            <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
