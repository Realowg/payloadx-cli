import { describe, it, expect } from 'vitest'
import { shallowDiff } from '../../src/utils/diff.js'

describe('shallowDiff', () => {
  it('returns empty array for identical objects', () => {
    const obj = { a: 1, b: 'hello' }
    expect(shallowDiff(obj, { ...obj })).toEqual([])
  })

  it('detects changed fields', () => {
    const before = { title: 'old', status: 'draft' }
    const after = { title: 'new', status: 'draft' }
    const diff = shallowDiff(before, after)
    expect(diff).toEqual([{ field: 'title', before: 'old', after: 'new' }])
  })

  it('detects added fields', () => {
    const before = { a: 1 }
    const after = { a: 1, b: 2 }
    const diff = shallowDiff(before, after)
    expect(diff).toEqual([{ field: 'b', before: undefined, after: 2 }])
  })

  it('detects removed fields', () => {
    const before = { a: 1, b: 2 }
    const after = { a: 1 }
    const diff = shallowDiff(before, after)
    expect(diff).toEqual([{ field: 'b', before: 2, after: undefined }])
  })
})
