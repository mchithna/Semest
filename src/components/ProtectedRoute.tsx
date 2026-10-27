import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  forgetOnboarded,
  hasFinishedOnboarding,
  rememberOnboarded,
  resolveOnboarding,
} from '@/lib/queries/profiles'

type OnboardingStatus = 'loading' | 'yes' | 'no' | 'unknown'

export function ProtectedRoute({
  children,
  allowIncomplete = false,
}: {
  children: React.ReactNode
  allowIncomplete?: boolean
}) {
  const { session, loading } = useAuth()
  const [status, setStatus] = useState<OnboardingStatus>('loading')
  const userId = session?.user.id ?? null
  const resolvedFor = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!userId) {
      resolvedFor.current = null
      return
    }

    // Narrowing from the guard above does not carry into a nested function.
    const id = userId

    // A token refresh hands us a new session for the same person. Replacing
    // the page with a spinner here unmounts the semester editor and drops
    // anything that has not been saved yet.
    let cancelled = false
    if (resolvedFor.current !== id) setStatus('loading')

    async function loadOnboarding() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarded_at')
          .eq('id', id)
          .maybeSingle()
        if (cancelled) return
        const next = resolveOnboarding(Boolean(error), data?.onboarded_at ?? null, hasFinishedOnboarding(id))
        if (!error && data?.onboarded_at) rememberOnboarded(id)
        if (!error && !data?.onboarded_at) forgetOnboarded(id)
        resolvedFor.current = id
        setStatus(next)
      } catch {
        if (cancelled) return
        resolvedFor.current = id
        setStatus(hasFinishedOnboarding(id) ? 'yes' : 'unknown')
      }
    }

    void loadOnboarding()

    return () => {
      cancelled = true
    }
  }, [loading, userId])

  if (loading || (session && status === 'loading')) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="sr-only">Loading</span>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/auth" replace />
  }

  if (!allowIncomplete && status === 'no') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
