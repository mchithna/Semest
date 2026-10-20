import { cn } from '@/lib/utils'

const bars = [
  'h-2.5 bg-band-pass',
  'h-3.5 bg-band-second-lower',
  'h-4 bg-band-second-upper',
  'h-3 bg-band-first',
]

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-foreground', className)}>
      <span className="flex items-end gap-[3px]" aria-hidden="true">
        {bars.map((bar) => (
          <span key={bar} className={cn('w-[3px] rounded-full', bar)} />
        ))}
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Semest</span>
    </span>
  )
}
