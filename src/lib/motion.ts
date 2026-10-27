export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Slide a marker along the scale. Reduced motion collapses this to nothing. */
export const markerShift = 'transition-[left] duration-[350ms] ease-out'
