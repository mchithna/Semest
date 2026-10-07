import { describe, expect, it } from 'vitest'
import { earlierModuleOptions, groupPriorModules } from './priorModules'

const semesters = [
  {
    id: 's1',
    title: 'Year 1, Semester 1',
    sem_index: 0,
    modules: [{ id: 'a', name: 'B5' }, { id: 'b', name: 'A1' }],
  },
  {
    id: 's2',
    title: 'Year 1, Semester 2',
    sem_index: 1,
    modules: [{ id: 'c', name: 'B5' }],
  },
  {
    id: 's3',
    title: 'Year 2, Semester 1',
    sem_index: 2,
    modules: [{ id: 'd', name: 'C1' }],
  },
]

describe('earlierModuleOptions', () => {
  it('keeps only semesters before the one being edited', () => {
    expect(earlierModuleOptions(semesters, 1).map((mod) => mod.id)).toEqual(['b', 'a'])
  })

  it('includes every saved semester when the new one is appended', () => {
    expect(earlierModuleOptions(semesters, null).map((mod) => mod.id)).toEqual(['b', 'a', 'c', 'd'])
  })
})

describe('groupPriorModules', () => {
  it('puts a matching name ahead of the other semesters', () => {
    const options = earlierModuleOptions(semesters, null)
    const groups = groupPriorModules(options, 'B5')
    expect(groups.map((group) => group.label)).toEqual([
      'Same name',
      'Year 1, Semester 1',
      'Year 2, Semester 1',
    ])
    expect(groups[0].modules.map((mod) => mod.id)).toEqual(['a', 'c'])
    expect(groups[1].modules.map((mod) => mod.id)).toEqual(['b'])
  })
})
