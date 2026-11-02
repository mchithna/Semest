import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  body: string
  action?: ReactNode
  ruler?: ReactNode
  heading?: 'h1' | 'h2' | 'h3'
  className?: string
}

const headingClass = {
  h1: 'font-display text-3xl font-semibold tracking-tight',
  h2: 'font-display text-2xl font-semibold tracking-tight',
  h3: 'font-display text-2xl font-semibold tracking-tight',
} as const

export function EmptyState({
  title,
  body,
  action,
  ruler,
  heading = 'h2',
  className,
}: EmptyStateProps) {
  const Heading = heading
  return (
    <div className={className ?? 'rounded-[22px] border border-dashed border-foreground/20 px-8 py-12 text-center'}>
      {ruler}
      <Heading className={headingClass[heading]}>{title}</Heading>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
