import { describe, expect, it } from 'vitest'
import { plannerView, requiredAverage } from './targetPlanner'

describe('plannerView', () => {
  it('says the class is already secured instead of an average', () => {
    const required = requiredAverage(3.47, 45, 2, 15)
    const view = plannerView({
      requiredGpa: required,
      target: 2,
      targetLabel: 'Pass',
      remaining: 15,
      remainingText: '15',
      maxPoints: 4,
      highestGpa: 3.8,
    })

    expect(view).toEqual({
      kind: 'statement',
      title: 'Already secured',
      detail: 'The 15 credits left cannot drop you below Pass.',
    })
  })

  it('says the target is out of reach and names the average the scale cannot give', () => {
    const required = requiredAverage(3.47, 45, 3.7, 15)
    const view = plannerView({
      requiredGpa: required,
      target: 3.7,
      targetLabel: 'First',
      remaining: 15,
      remainingText: '15',
      maxPoints: 4,
      highestGpa: 3.8,
    })

    expect(view).toEqual({
      kind: 'statement',
      title: 'Out of reach',
      detail: 'The 15 credits left would need to average 4.39 to reach First. This scale tops out at 4.00.',
    })
  })

  it('keeps a reachable average as a number', () => {
    const view = plannerView({
      requiredGpa: 3.2,
      target: 3.3,
      targetLabel: 'Second upper',
      remaining: 15,
      remainingText: '15',
      maxPoints: 4,
      highestGpa: 3.8,
    })

    expect(view.kind).toBe('number')
    if (view.kind === 'number') expect(view.value).toBe(3.2)
  })
})
