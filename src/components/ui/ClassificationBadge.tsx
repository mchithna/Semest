import { Badge } from '@/components/ui/badge'
import type { Band } from '@/lib/bands'
import { CLASSIFICATION_META, classify } from '@/lib/score'
import { cn } from '@/lib/utils'

interface ClassificationBadgeProps {
  score: number | string
  graded?: boolean
  classBands?: Band[]
  className?: string
}

export function ClassificationBadge({ score, graded = false, classBands = [], className }: ClassificationBadgeProps) {
  const classification = typeof score === 'number' ? classify(score, graded, classBands) : score
  const meta = CLASSIFICATION_META[classification] || CLASSIFICATION_META['Unknown']

  return (
    <Badge
      variant={meta.badgeVariant}
      className={cn(
        meta.color,
        'max-w-full font-mono text-xs uppercase tracking-widest px-2 py-0.5',
        className,
      )}
    >
      {meta.label}
    </Badge>
  )
}
