import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet'
import { useAuth } from '@/context/AuthContext'
import { LOGO_BARS } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import { NavActionSlot } from './NavActions'

/** Same order as the mark: indigo, teal, gold, coral. */
const TAB_COLOR: Record<string, string> = {
  '/dashboard': LOGO_BARS[0].color,
  '/degrees': LOGO_BARS[1].color,
  '/presets': LOGO_BARS[2].color,
  '/settings': LOGO_BARS[3].color,
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex h-16 items-center text-sm text-muted-foreground transition-colors hover:text-foreground',
    isActive && 'text-foreground',
  )

function placeTabBar(list: HTMLElement, bar: HTMLElement) {
  const active = list.querySelector<HTMLElement>('[aria-current="page"]')
  if (!active) {
    bar.style.opacity = '0'
    return
  }
  bar.style.opacity = '1'
  bar.style.left = `${active.offsetLeft}px`
  bar.style.width = `${active.offsetWidth}px`
  bar.style.backgroundColor = TAB_COLOR[active.dataset.nav ?? ''] ?? LOGO_BARS[2].color
}

export function Nav() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const linksRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const barReady = useRef(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const navLinks = session
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Degrees', path: '/degrees' },
        { label: 'Presets', path: '/presets' },
        { label: 'Settings', path: '/settings' },
      ]
    : [{ label: 'Browse presets', path: '/presets' }]

  useLayoutEffect(() => {
    const list = linksRef.current
    const bar = barRef.current
    if (!list || !bar) return
    placeTabBar(list, bar)
    if (barReady.current) return
    const frame = requestAnimationFrame(() => {
      barReady.current = true
      bar.dataset.ready = ''
    })
    return () => cancelAnimationFrame(frame)
  })

  useEffect(() => {
    const list = linksRef.current
    if (!list) return
    const observer = new ResizeObserver(() => {
      const bar = barRef.current
      if (bar) placeTabBar(list, bar)
    })
    observer.observe(list)
    return () => observer.disconnect()
  }, [session])

  const accountActions = session ? (
    <Button variant="outline" onClick={handleSignOut}>
      Sign out
    </Button>
  ) : (
    <>
      <Button variant="outline" onClick={() => navigate('/auth')}>
        Log in
      </Button>
      <Button onClick={() => navigate('/auth')}>Get started</Button>
    </>
  )

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link to={session ? '/dashboard' : '/'} aria-label="Semest home" className="shrink-0">
            <Logo />
          </Link>
          <div ref={linksRef} className="relative hidden h-16 items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} data-nav={link.path} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
            <span ref={barRef} aria-hidden className="nav-tab-bar pointer-events-none absolute bottom-0 h-0.5 opacity-0" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavActionSlot className="flex items-center gap-2 empty:hidden" />
          <div className="hidden items-center gap-2 md:flex">{accountActions}</div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] border-border bg-background p-6">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        cn(
                          'border-b-2 border-transparent py-3 text-base text-muted-foreground transition-colors',
                          isActive && 'text-foreground',
                        )
                      }
                      style={({ isActive }) => (isActive ? { borderBottomColor: TAB_COLOR[link.path] } : undefined)}
                    >
                      {link.label}
                    </NavLink>
                  ))}
                  <div className="mt-6 flex flex-col gap-2">{accountActions}</div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
