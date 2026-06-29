import { useState } from 'react'
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
    const { data } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .single()

    if (data?.onboarded_at) {
      navigate('/dashboard')
    } else {
      navigate('/onboarding')
    }
  }

  const onSignIn = async (data: FormData) => {
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error(error.message)
      return
    }
    await redirectAfterSignIn()
  }

  const onSignUp = async (data: FormData) => {
    const { error } = await signUp(data.email, data.password)
    if (error) {
      toast.error(error.message)
      return
    }
    // New user — always go to onboarding
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/30">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-foreground">
              UniScore Track
            </h1>
            <p className="text-xs tracking-widest uppercase text-muted-foreground mt-1">
              Academic Performance System
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted rounded-lg h-10">
              <TabsTrigger
                value="signin"
                className="rounded-md text-xs tracking-widest uppercase font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-muted-foreground"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-md text-xs tracking-widest uppercase font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-bold text-muted-foreground"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSubmit(onSignIn)} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Email
                  </Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive font-mono">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive font-mono">{errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs tracking-widest uppercase rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up */}
            <TabsContent value="signup">
              <form onSubmit={handleSubmit(onSignUp)} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Email
                  </Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive font-mono">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-muted-foreground font-mono">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-primary focus-visible:border-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive font-mono">{errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs tracking-widest uppercase rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground font-mono">
                  Your data is private and secured by Supabase.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground font-mono mt-6 tracking-widest uppercase">
          Calculate · Persist · Visualize
        </p>
      </div>
    </div>
  )
}
