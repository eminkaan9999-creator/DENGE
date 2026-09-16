import type { JointPoint } from '../models/types'

export function calculateAngle(a?: JointPoint, b?: JointPoint, c?: JointPoint): number | null {
  if (!a || !b || !c) return null
  const abx = a.x - b.x
  const aby = a.y - b.y
  const cbx = c.x - b.x
  const cby = c.y - b.y
  const magnitudeAB = Math.hypot(abx, aby)
  const magnitudeCB = Math.hypot(cbx, cby)
  if (magnitudeAB < Number.EPSILON || magnitudeCB < Number.EPSILON) return null
  const cosine = (abx * cbx + aby * cby) / (magnitudeAB * magnitudeCB)
  return (Math.acos(Math.min(1, Math.max(-1, cosine))) * 180) / Math.PI
}

export function averageVisibility(...points: Array<JointPoint | undefined>): number {
  const valid = points.filter((point): point is JointPoint => Boolean(point))
  return valid.length ? valid.reduce((total, point) => total + point.visibility, 0) / valid.length : 0
}
