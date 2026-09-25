import { Badge } from '@/components/ui/badge'
import { CLASSIFICATION_META, classify } from '@/lib/score'

interface ClassificationBadgeProps {
  score: number | string
  graded?: boolean
}

export function ClassificationBadge({ score, graded = false }: ClassificationBadgeProps) {
  const classification = typeof score === 'number' ? classify(score, graded) : score
  const meta = CLASSIFICATION_META[classification] || CLASSIFICATION_META['Unknown']

  return (
    <Badge
      variant={meta.badgeVariant}
      className={`${meta.color} font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 whitespace-nowrap`}
    >
      {meta.label}
    </Badge>
  )
}
