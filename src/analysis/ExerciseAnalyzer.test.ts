import { describe, expect, it } from 'vitest'
import { PullUpAnalyzer, PushUpAnalyzer, SitUpAnalyzer } from './ExerciseAnalyzer'
import type { JointPoint, PoseFrame } from '../models/types'

function point(jointName: JointPoint['jointName'], x: number, y: number): JointPoint {
  return { jointName, x, y, z: 0, visibility: 1 }
}

function poseAtAngle(angle: number): PoseFrame {
  const radians = (angle * Math.PI) / 180
  const shoulder = { x: 0.6, y: 0.5 }
  const vertex = { x: 0.5, y: 0.5 }
  const end = { x: vertex.x + Math.cos(radians) * 0.1, y: vertex.y + Math.sin(radians) * 0.1 }
  return {
    leftShoulder: point('leftShoulder', shoulder.x, shoulder.y), leftElbow: point('leftElbow', vertex.x, vertex.y), leftWrist: point('leftWrist', end.x, end.y),
    rightShoulder: point('rightShoulder', shoulder.x, shoulder.y), rightElbow: point('rightElbow', vertex.x, vertex.y), rightWrist: point('rightWrist', end.x, end.y),
    leftHip: point('leftHip', vertex.x, vertex.y), leftKnee: point('leftKnee', end.x, end.y), rightHip: point('rightHip', vertex.x, vertex.y), rightKnee: point('rightKnee', end.x, end.y),
  }
}

function feed(analyzer: { process(pose: PoseFrame): void }, angle: number): void {
  for (let index = 0; index < 3; index += 1) analyzer.process(poseAtAngle(angle))
}

describe('hareket state machine sayaçları', () => {
  it('şınav UP → DOWN → UP dizisinde bir tekrar sayar', () => {
    const analyzer = new PushUpAnalyzer(); feed(analyzer, 170); feed(analyzer, 70); feed(analyzer, 170)
    expect(analyzer.repetitionCount).toBe(1)
  })
  it('şınavda küçük hareketi tekrar saymaz', () => {
    const analyzer = new PushUpAnalyzer(); feed(analyzer, 170); feed(analyzer, 120); feed(analyzer, 170)
    expect(analyzer.repetitionCount).toBe(0)
  })
  it('mekik DOWN → UP → DOWN dizisinde bir tekrar sayar', () => {
    const analyzer = new SitUpAnalyzer(); feed(analyzer, 170); feed(analyzer, 70); feed(analyzer, 170)
    expect(analyzer.repetitionCount).toBe(1)
  })
  it('barfikste DOWN → UP → DOWN dizisinde bir tekrar sayar', () => {
    const analyzer = new PullUpAnalyzer(); feed(analyzer, 170); feed(analyzer, 70); feed(analyzer, 170)
    expect(analyzer.repetitionCount).toBe(1)
  })
})
