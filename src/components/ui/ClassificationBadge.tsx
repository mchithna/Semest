import { Badge } from '@/components/ui/badge'
import { CLASSIFICATION_META, classify } from '@/lib/score'
import { cn } from '@/lib/utils'

interface ClassificationBadgeProps {
  score: number | string
  graded?: boolean
  className?: string
}

export function ClassificationBadge({ score, graded = false, className }: ClassificationBadgeProps) {
  const classification = typeof score === 'number' ? classify(score, graded) : score
  const meta = CLASSIFICATION_META[classification] || CLASSIFICATION_META['Unknown']

  return (
    <Badge
      variant={meta.badgeVariant}
      className={cn(
        meta.color,
        'max-w-full font-mono text-[10px] uppercase tracking-widest px-2 py-0.5',
        className,
      )}
    >
      {meta.label}
    </Badge>
  )
}
