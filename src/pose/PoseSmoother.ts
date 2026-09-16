import type { JointName, JointPoint, PoseFrame } from '../models/types'

export class PoseSmoother {
  private history: PoseFrame[] = []

  constructor(private readonly frameCount: number) {}

  smooth(frame: PoseFrame): PoseFrame {
    this.history.push(frame)
    this.history = this.history.slice(-this.frameCount)
    const result: PoseFrame = {}
    const joints = new Set<JointName>(this.history.flatMap((entry) => Object.keys(entry) as JointName[]))

    joints.forEach((jointName) => {
      const samples = this.history.map((entry) => entry[jointName]).filter((point): point is JointPoint => Boolean(point))
      if (!samples.length) return
      const count = samples.length
      result[jointName] = {
        jointName,
        x: samples.reduce((sum, point) => sum + point.x, 0) / count,
        y: samples.reduce((sum, point) => sum + point.y, 0) / count,
        z: samples.reduce((sum, point) => sum + point.z, 0) / count,
        visibility: samples.reduce((sum, point) => sum + point.visibility, 0) / count,
      }
    })
    return result
  }

  reset(): void { this.history = [] }
}
