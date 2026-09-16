import { exerciseConfig } from '../config/exerciseConfig'
import type { ExerciseType, PoseFrame } from '../models/types'
import { averageVisibility, calculateAngle } from '../utils/angle'

type Phase = 'UNKNOWN' | 'UP' | 'DOWN'

abstract class PhaseExerciseAnalyzer {
  protected phase: Phase = 'UNKNOWN'
  protected repetitions = 0
  private candidate: Phase = 'UNKNOWN'
  private candidateFrames = 0

  get repetitionCount(): number { return this.repetitions }

  process(pose: PoseFrame): void {
    const phase = this.phaseFor(pose)
    if (phase === 'UNKNOWN') return
    if (phase === this.candidate) this.candidateFrames += 1
    else {
      this.candidate = phase
      this.candidateFrames = 1
    }
    if (this.candidateFrames >= 3) this.consumeStablePhase(phase)
  }

  reset(): void {
    this.phase = 'UNKNOWN'
    this.repetitions = 0
    this.candidate = 'UNKNOWN'
    this.candidateFrames = 0
  }

  protected abstract phaseFor(pose: PoseFrame): Phase
  protected abstract transition(previous: Phase, next: Phase): boolean

  private consumeStablePhase(next: Phase): void {
    if (this.phase === 'UNKNOWN') {
      this.phase = next
      return
    }
    if (this.transition(this.phase, next)) this.repetitions += 1
    this.phase = next
  }
}

export interface ExerciseAnalyzer {
  readonly repetitionCount: number
  process(pose: PoseFrame): void
  reset(): void
}

export class PushUpAnalyzer extends PhaseExerciseAnalyzer {
  protected phaseFor(pose: PoseFrame): Phase {
    const leftVisibility = averageVisibility(pose.leftShoulder, pose.leftElbow, pose.leftWrist)
    const rightVisibility = averageVisibility(pose.rightShoulder, pose.rightElbow, pose.rightWrist)
    const angle = leftVisibility >= rightVisibility
      ? calculateAngle(pose.leftShoulder, pose.leftElbow, pose.leftWrist) ?? calculateAngle(pose.rightShoulder, pose.rightElbow, pose.rightWrist)
      : calculateAngle(pose.rightShoulder, pose.rightElbow, pose.rightWrist) ?? calculateAngle(pose.leftShoulder, pose.leftElbow, pose.leftWrist)
    if (angle === null) return 'UNKNOWN'
    if (angle >= exerciseConfig.pushUp.upAngle) return 'UP'
    if (angle <= exerciseConfig.pushUp.downAngle) return 'DOWN'
    return 'UNKNOWN'
  }

  protected transition(previous: Phase, next: Phase): boolean {
    return previous === 'DOWN' && next === 'UP'
  }
}

export class SitUpAnalyzer extends PhaseExerciseAnalyzer {
  protected phaseFor(pose: PoseFrame): Phase {
    const angle = calculateAngle(pose.leftShoulder, pose.leftHip, pose.leftKnee)
      ?? calculateAngle(pose.rightShoulder, pose.rightHip, pose.rightKnee)
    if (angle === null) return 'UNKNOWN'
    if (angle >= exerciseConfig.sitUp.downAngle) return 'DOWN'
    if (angle <= exerciseConfig.sitUp.upAngle) return 'UP'
    return 'UNKNOWN'
  }

  protected transition(previous: Phase, next: Phase): boolean {
    return previous === 'UP' && next === 'DOWN'
  }
}

export class PullUpAnalyzer extends PhaseExerciseAnalyzer {
  protected phaseFor(pose: PoseFrame): Phase {
    const leftAngle = calculateAngle(pose.leftShoulder, pose.leftElbow, pose.leftWrist)
    const rightAngle = calculateAngle(pose.rightShoulder, pose.rightElbow, pose.rightWrist)
    const angle = leftAngle ?? rightAngle
    if (angle === null) return 'UNKNOWN'
    if (angle >= exerciseConfig.pullUp.downAngle) return 'DOWN'
    if (angle <= exerciseConfig.pullUp.upAngle) return 'UP'
    return 'UNKNOWN'
  }

  protected transition(previous: Phase, next: Phase): boolean {
    return previous === 'UP' && next === 'DOWN'
  }
}

export function createExerciseAnalyzer(exercise: ExerciseType): ExerciseAnalyzer {
  switch (exercise) {
    case 'pushUp': return new PushUpAnalyzer()
    case 'sitUp': return new SitUpAnalyzer()
    case 'pullUp': return new PullUpAnalyzer()
  }
}
