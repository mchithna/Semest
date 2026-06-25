import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <nav className="sticky top-0 z-50 w-full border-b border-[#1e3a5f] bg-[#1e293b]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1e293b]/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
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
                    ? 'text-emerald-400 font-bold' 
                    : 'text-slate-300 hover:text-emerald-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="h-6 w-px bg-[#1e3a5f]"></div>

          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-slate-400 hidden lg:inline-block">
                {session.user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-slate-300 hover:text-rose-400 hover:bg-rose-400/10 font-mono text-xs uppercase tracking-widest"
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
                className="text-slate-300 hover:text-emerald-400 hover:bg-transparent font-mono text-sm uppercase tracking-widest"
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

        {/* Mobile Nav Toggle placeholder */}
        <div className="md:hidden flex items-center">
          {/* We will add the Sheet in Commit 3, for now just a stub button */}
          <Button variant="ghost" size="icon" className="text-slate-300">
            <Menu className="h-6 w-6" />
          </Button>
        </div>

      </div>
    </nav>
  )
}
