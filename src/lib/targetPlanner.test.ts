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
      title: 'Pass is already secured',
      tone: 'secured',
      detail: 'The 15 credits left cannot drop you below it.',
    })
  })

  it('says the target is out of reach and names the class', () => {
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
      title: 'First is out of reach',
      tone: 'unreachable',
      detail: 'Even a 4.00 on the 15 credits left is not enough. Reaching it would take 4.39.',
    })
  })

  it('calls an average below the best semester within reach', () => {
    const view = plannerView({
      requiredGpa: 2.8,
      target: 3.3,
      targetLabel: 'Second upper',
      remaining: 15,
      remainingText: '15',
      maxPoints: 4,
      highestGpa: 3.8,
    })

    expect(view).toEqual({
      kind: 'number',
      value: 2.8,
      title: 'Within reach',
      tone: 'reach',
      detail: 'Average this on the 15 credits left to reach Second upper. That is below your best semester, 3.80.',
    })
  })

  it('calls an average above the best semester hard', () => {
    const view = plannerView({
      requiredGpa: 3.9,
      target: 3.7,
      targetLabel: 'First',
      remaining: 15,
      remainingText: '15',
      maxPoints: 4,
      highestGpa: 3.2,
    })

    expect(view).toEqual({
      kind: 'number',
      value: 3.9,
      title: 'This is hard',
      tone: 'hard',
      detail: 'Average this on the 15 credits left to reach First. That is above your best semester, 3.20.',
    })
  })
})
