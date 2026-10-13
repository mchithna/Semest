import { useEffect, useState, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/motion'

interface AnimatedNumberProps {
  value: number
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, decimals = 4, duration = 500, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const startTime = useRef<number | null>(null)
  const startValue = useRef<number>(value)
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value)
      startValue.current = value
      return
    }

    // If the value hasn't changed or it's the initial render
    if (value === displayValue && startValue.current === value) return

    // ease-out cubic curve
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

    const animate = (timestamp: number) => {
      if (startTime.current === null) {
        startTime.current = timestamp
        startValue.current = displayValue
      }

      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const current = startValue.current + (value - startValue.current) * easedProgress
      setDisplayValue(current)

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(value)
        startValue.current = value
      }
    }

    startTime.current = null
    rafId.current = requestAnimationFrame(animate)

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [value, duration])

  return (
    <span className={className}>
      {displayValue.toFixed(decimals)}
    </span>
  )
}
