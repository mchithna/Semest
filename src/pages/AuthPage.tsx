import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, GraduationCap } from 'lucide-react'
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
    <div className="min-h-screen flex items-center justify-center bg-[#1e293b] px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-sm bg-emerald-400/10 border border-emerald-400/30">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-slate-100">
              UniScore Track
            </h1>
            <p className="text-xs tracking-widest uppercase text-slate-500 mt-1">
              Academic Performance System
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#273449] border border-[#1e3a5f] rounded-sm p-8 shadow-2xl">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#1e293b] rounded-sm h-10">
              <TabsTrigger
                value="signin"
                className="rounded-sm text-xs tracking-widest uppercase font-mono data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 data-[state=active]:font-bold text-slate-400"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="rounded-sm text-xs tracking-widest uppercase font-mono data-[state=active]:bg-emerald-400 data-[state=active]:text-slate-900 data-[state=active]:font-bold text-slate-400"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* Sign In */}
            <TabsContent value="signin">
              <form onSubmit={handleSubmit(onSignIn)} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-slate-400 font-mono">
                    Email
                  </Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 placeholder:text-slate-600 rounded-sm focus-visible:ring-emerald-400 focus-visible:border-emerald-400"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 font-mono">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-slate-400 font-mono">
                    Password
                  </Label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 placeholder:text-slate-600 rounded-sm focus-visible:ring-emerald-400 focus-visible:border-emerald-400"
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-400 font-mono">{errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-xs tracking-widest uppercase rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-400/20"
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
                  <Label className="text-xs tracking-widest uppercase text-slate-400 font-mono">
                    Email
                  </Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="you@university.edu"
                    autoComplete="email"
                    className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 placeholder:text-slate-600 rounded-sm focus-visible:ring-emerald-400 focus-visible:border-emerald-400"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-400 font-mono">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs tracking-widest uppercase text-slate-400 font-mono">
                    Password
                  </Label>
                  <Input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="bg-[#1e293b] border-[#1e3a5f] text-slate-100 placeholder:text-slate-600 rounded-sm focus-visible:ring-emerald-400 focus-visible:border-emerald-400"
                  />
                  {errors.password && (
                    <p className="text-xs text-rose-400 font-mono">{errors.password.message}</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-xs tracking-widest uppercase rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-400/20"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Account'
                  )}
                </Button>
                <p className="text-center text-xs text-slate-500 font-mono">
                  Your data is private and secured by Supabase.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 font-mono mt-6 tracking-widest uppercase">
          Calculate · Persist · Visualize
        </p>
      </div>
    </div>
  )
}
