import { useEffect, useState } from 'react'
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

  useEffect(() => {
    if (loading) return
    if (!session) return

    let cancelled = false
    setStatus('loading')
    supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        const next = resolveOnboarding(Boolean(error), data?.onboarded_at ?? null, hasFinishedOnboarding(session.user.id))
        if (!error && data?.onboarded_at) rememberOnboarded(session.user.id)
        if (!error && !data?.onboarded_at) forgetOnboarded(session.user.id)
        setStatus(next)
      })
      .catch(() => {
        if (cancelled) return
        setStatus(hasFinishedOnboarding(session.user.id) ? 'yes' : 'unknown')
      })

    return () => {
      cancelled = true
    }
  }, [loading, session])

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
