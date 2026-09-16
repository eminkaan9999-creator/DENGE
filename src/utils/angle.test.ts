import { describe, expect, it } from 'vitest'
import { calculateAngle } from './angle'

const point = (x: number, y: number) => ({ jointName: 'nose' as const, x, y, z: 0, visibility: 1 })

describe('calculateAngle', () => {
  it('vertex noktasındaki açıyı derece olarak döndürür', () => {
    expect(calculateAngle(point(1, 0), point(0, 0), point(0, 1))).toBeCloseTo(90)
  })

  it('eksik noktada null döndürür', () => {
    expect(calculateAngle(undefined, point(0, 0), point(0, 1))).toBeNull()
  })
})
