import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { LIMITS } from '@/lib/limits'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'

function sameUser(current: User | null, next: User | null) {
  if (current === next) return true
  if (!current || !next) return false
  return current.id === next.id && current.email === next.email && current.updated_at === next.updated_at
}

function sameSession(current: Session | null, next: Session | null) {
  if (current === next) return true
  if (!current || !next) return false
  return current.access_token === next.access_token && sameUser(current.user, next.user)
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Supabase emits SIGNED_IN again whenever this tab becomes visible.
    // Keep the current objects when the login itself has not changed, so a
    // tab switch does not remount the page and wipe an in-progress semester.
    const applySession = (session: Session | null) => {
      setSession((current) => (sameSession(current, session) ? current : session))
      setUser((current) => {
        const next = session?.user ?? null
        return sameUser(current, next) ? current : next
      })
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const name = displayName.trim()
    if (password.length < LIMITS.passwordMin) {
      return { error: new Error('Password must be at least 8 characters'), needsConfirmation: false }
    }
    if (password.length > LIMITS.passwordMax) {
      return { error: new Error('Password must be 72 characters or fewer'), needsConfirmation: false }
    }
    if (name.length > LIMITS.displayName) {
      return { error: new Error('Name must be 80 characters or fewer'), needsConfirmation: false }
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    })
    if (!error && data.user && name) {
      await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', data.user.id)
    }
    return { error, needsConfirmation: !error && !data.session }
  }

  const signOut = async () => {
    queryClient.clear()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
