import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { useAuth } from '@/context/AuthContext'

export function Nav() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const navLinks = session ? [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Degrees', path: '/degrees' },
    { label: 'Presets', path: '/presets' },
    { label: 'Settings', path: '/settings/scales' },
  ] : [
    { label: 'Browse Presets', path: '/presets' },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <GraduationCap className="h-6 w-6" />
            <span className="font-mono text-xl font-bold tracking-widest uppercase hidden sm:inline-block">
              UniScore Track
            </span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-4">
            {navLinks.map(link => (
              <Link 
                key={link.path} 
                to={link.path}
                className={`text-sm font-mono tracking-wider uppercase transition-colors ${
                  location.pathname.startsWith(link.path) 
                    ? 'text-primary font-bold' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-border"></div>

          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-400 hidden lg:inline-block">
                {session.user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-mono text-xs uppercase tracking-widest"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="text-muted-foreground hover:text-primary hover:bg-transparent font-mono text-sm uppercase tracking-widest"
              >
                Log in
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono text-sm uppercase tracking-widest"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-emerald-400">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background border-border p-6 w-[300px]">
              <SheetHeader className="text-left mb-8 hidden">
                <SheetTitle className="text-emerald-400 font-mono tracking-widest uppercase">Navigation</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  {navLinks.map(link => (
                    <Link 
                      key={link.path} 
                      to={link.path}
                      className={`text-lg font-mono tracking-wider uppercase transition-colors ${
                        location.pathname.startsWith(link.path) 
                          ? 'text-primary font-bold' 
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>

                <div className="h-px w-full bg-border"></div>

                {session ? (
                  <div className="flex flex-col gap-4">
                    <span className="text-sm font-mono text-slate-400 truncate">
                      {session.user.email}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="w-full justify-start border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 font-mono uppercase tracking-widest"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/auth')}
                      className="w-full justify-center border-border text-muted-foreground hover:text-primary font-mono uppercase tracking-widest"
                    >
                      Log in
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="w-full justify-center bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold font-mono uppercase tracking-widest"
                    >
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </nav>
  )
}
