import { cn } from '@/lib/utils'
import { LOGO_BAR_GAP, LOGO_BAR_WIDTH, LOGO_BARS, LOGO_TEXT_GAP, LOGO_TEXT_SIZE } from '@/lib/brand'

type LogoProps = {
  className?: string
  /** Multiplier on the 17px header size. Export templates pass their own scale. */
  scale?: number
  /** Unit for the scaled sizes. PDF-sized previews use "pt". */
  unit?: 'px' | 'pt'
  color?: string
}

export function Logo({ className, scale = 1, unit = 'px', color }: LogoProps) {
  const u = (value: number) => `${value * scale}${unit}`
  return (
    <span
      className={cn('inline-flex items-center text-foreground', className)}
      style={{ gap: u(LOGO_TEXT_GAP), color, lineHeight: 1 }}
    >
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: u(LOGO_BAR_GAP) }} aria-hidden="true">
        {LOGO_BARS.map((bar) => (
          <span
            key={bar.color}
            style={{ width: u(LOGO_BAR_WIDTH), height: u(bar.height), borderRadius: 999, background: bar.color }}
          />
        ))}
      </span>
      <span style={{ fontSize: u(LOGO_TEXT_SIZE), fontWeight: 600, letterSpacing: '-0.01em' }}>Semest</span>
    </span>
  )
}
