import { describe, it, expect } from 'vitest'
import { GRADE_LABELS, GRADES } from './kanjiGrade'

describe('kanjiGrade', () => {
  it('8種類の学年が定義されている', () => {
    expect(GRADES).toHaveLength(8)
  })

  it('grade0 の表示名は「ようちえん」', () => {
    expect(GRADE_LABELS.grade0).toBe('ようちえん')
  })

  it('grade7 の表示名は「中学生以上」', () => {
    expect(GRADE_LABELS.grade7).toBe('中学生以上')
  })

  it('全 Grade に表示名が存在する', () => {
    for (const grade of GRADES) {
      expect(GRADE_LABELS[grade]).toBeTruthy()
    }
  })
})
