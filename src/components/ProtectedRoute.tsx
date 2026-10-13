import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({
  children,
  allowIncomplete = false,
}: {
  children: React.ReactNode
  allowIncomplete?: boolean
}) {
  const { session, loading } = useAuth()
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [onboarded, setOnboarded] = useState(false)

  useEffect(() => {
    if (loading || !session) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        setOnboarded(Boolean(data?.onboarded_at))
        setCheckingProfile(false)
      })
    return () => {
      cancelled = true
    }
  }, [loading, session])

  if (loading || (session && checkingProfile)) {
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

  if (!allowIncomplete && !onboarded) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
