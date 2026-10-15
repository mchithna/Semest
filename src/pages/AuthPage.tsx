import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, GraduationCap, Eye, EyeOff } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { friendlyError } from '@/lib/errors'
import { hasFinishedOnboarding, rememberOnboarded } from '@/lib/queries/profiles'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type FormData = z.infer<typeof schema>

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)
  const [mode, setMode] = useState<'auth' | 'forgot' | 'recovery'>('auth')
  const [resetEmail, setResetEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'signin' | 'signup')
    reset()
  }

  const redirectAfterSignIn = async () => {
    const { data: { session: current } } = await supabase.auth.getSession()
    const userId = current?.user.id
    const { data, error } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .maybeSingle()

    const finished = !error && Boolean(data?.onboarded_at)
    if (finished && userId) rememberOnboarded(userId)
    if (finished || (error && userId && hasFinishedOnboarding(userId))) {
      navigate('/dashboard')
      return
    }
    if (error) {
      navigate('/dashboard')
      return
    }
    navigate('/onboarding')
  }

  const onSignIn = async (data: FormData) => {
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error(friendlyError(error, "Couldn't sign in. Try again."))
      return
    }
    await redirectAfterSignIn()
  }

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const onSignUp = async (data: FormData) => {
    const { error, needsConfirmation } = await signUp(data.email, data.password)
    if (error) {
      toast.error(friendlyError(error, "Couldn't create the account. Try again."))
      return
    }
    if (needsConfirmation) {
      setConfirmEmail(data.email)
      return
    }
    navigate('/onboarding')
  }

  const sendReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth`,
    })
    setBusy(false)
    if (error) {
      toast.error(friendlyError(error, "Couldn't send the reset email. Try again."))
      return
    }
    setResetSent(true)
  }

  const saveNewPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setBusy(false)
    if (error) {
      toast.error(friendlyError(error, "Couldn't update the password. Try again."))
      return
    }
    toast.success('Password updated')
    setMode('auth')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <title>{`${mode === 'forgot' ? 'Reset password' : mode === 'recovery' ? 'New password' : 'Sign in'} · Semest`}</title>
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/30">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-foreground">
              Semest
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Academic performance system
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          {confirmEmail && (
            <div className="space-y-4 text-center">
              <h2 className="font-sans text-base font-semibold text-foreground">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to {confirmEmail}. Open it, then sign in.
              </p>
              <Button variant="outline" className="" onClick={() => setConfirmEmail(null)}>Back to sign in</Button>
            </div>
          )}

          {mode === 'forgot' && !confirmEmail && (
            <form onSubmit={sendReset} className="space-y-5">
              <h2 className="font-sans text-base font-semibold text-foreground">Reset password</h2>
              {resetSent ? (
                <p className="text-sm text-muted-foreground">If that email has an account, a reset link is on its way.</p>
              ) : (
                <div className="space-y-2 text-left">
                  <Label htmlFor="reset-email" className="text-xs tracking-widest uppercase text-muted-foreground font-mono">Email</Label>
                  <Input id="reset-email" type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@university.edu" className="font-mono" />
                </div>
              )}
              {!resetSent && (
                <Button type="submit" disabled={busy} className="w-full text-xs">
                  {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {busy ? 'Sending reset link…' : 'Send reset link'}
                </Button>
              )}
              <Button type="button" variant="ghost" className="w-full" onClick={() => setMode('auth')}>Back</Button>
            </form>
          )}

          {mode === 'recovery' && !confirmEmail && (
            <form onSubmit={saveNewPassword} className="space-y-5">
              <h2 className="font-sans text-base font-semibold text-foreground">Choose a new password</h2>
              <div className="space-y-2 text-left">
                <Label htmlFor="new-password" className="text-xs tracking-widest uppercase text-muted-foreground font-mono">New password</Label>
                <Input id="new-password" type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="font-mono" />
              </div>
              <Button type="submit" disabled={busy} className="w-full text-xs">
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {busy ? 'Updating password…' : 'Update password'}
              </Button>
            </form>
          )}

          {mode === 'auth' && !confirmEmail && (
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted rounded-lg h-10">
              <TabsTrigger
                value="signin"
                className="rounded-md text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-muted-foreground"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-md text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-muted-foreground"
              >
                Sign up
              </TabsTrigger>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSubmit(onSignIn)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Email
                  </Label>
                  <Input
                    id="signin-email"
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'signin-email-error' : undefined}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                  {errors.email && (
                    <p id="signin-email-error" className="text-xs text-destructive font-mono">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'signin-password-error' : undefined}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="signin-password-error" className="text-xs text-destructive font-mono">{errors.password.message}</p>
                  )}
                </div>
                <button type="button" onClick={() => setMode('forgot')} className="text-xs font-mono text-muted-foreground hover:text-primary">
                  Forgot password?
                </button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {isSubmitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup">
              <form onSubmit={handleSubmit(onSignUp)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'signup-email-error' : undefined}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                  {errors.email && (
                    <p id="signup-email-error" className="text-xs text-destructive font-mono">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'signup-password-error' : undefined}
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="signup-password-error" className="text-xs text-destructive font-mono">{errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                  {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Your data is private and secured by Supabase.
                </p>
              </form>
            </TabsContent>
          </Tabs>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Calculate · persist · visualize
        </p>
      </div>
    </div>
  )
}
