import { exerciseConfig } from '../config/exerciseConfig'
import type { ExerciseType, FormAnalysisResult, FormState, PoseFrame, SegmentName } from '../models/types'
import { calculateAngle } from '../utils/angle'

export interface FormAnalyzer {
  analyze(pose: PoseFrame): FormAnalysisResult
}

function makeResult(states: Partial<Record<SegmentName, FormState>>, issues: string[] = []): FormAnalysisResult {
  const allStates = Object.values(states)
  const overallState: FormState = allStates.includes('INCORRECT') ? 'INCORRECT' : allStates.includes('CORRECT') ? 'CORRECT' : 'UNKNOWN'
  const jointStates: FormAnalysisResult['jointStates'] = {}
  const mappings: Record<SegmentName, Array<keyof FormAnalysisResult['jointStates']>> = {
    leftArm: ['leftShoulder', 'leftElbow', 'leftWrist'], rightArm: ['rightShoulder', 'rightElbow', 'rightWrist'],
    shoulderLine: ['leftShoulder', 'rightShoulder'], leftTorso: ['leftShoulder', 'leftHip'], rightTorso: ['rightShoulder', 'rightHip'],
    hipLine: ['leftHip', 'rightHip'], leftLeg: ['leftHip', 'leftKnee', 'leftAnkle'], rightLeg: ['rightHip', 'rightKnee', 'rightAnkle'],
  }
  for (const [segment, state] of Object.entries(states) as Array<[SegmentName, FormState]>) {
    mappings[segment].forEach((joint) => {
      if (state === 'INCORRECT' || !jointStates[joint] || jointStates[joint] === 'UNKNOWN') jointStates[joint] = state
    })
  }
  return { overallState, jointStates, segmentStates: states, detectedIssues: issues }
}

function armState(pose: PoseFrame, side: 'left' | 'right', min: number, max: number): FormState {
  const angle = calculateAngle(pose[`${side}Shoulder` as const], pose[`${side}Elbow` as const], pose[`${side}Wrist` as const])
  if (angle === null) return 'UNKNOWN'
  return angle >= min && angle <= max ? 'CORRECT' : 'INCORRECT'
}

export class PushUpFormAnalyzer implements FormAnalyzer {
  analyze(pose: PoseFrame): FormAnalysisResult {
    const torsoAngle = calculateAngle(pose.leftShoulder, pose.leftHip, pose.leftKnee)
      ?? calculateAngle(pose.rightShoulder, pose.rightHip, pose.rightKnee)
    const torso = torsoAngle === null ? 'UNKNOWN' : Math.abs(180 - torsoAngle) <= exerciseConfig.pushUp.bodyAlignmentTolerance ? 'CORRECT' : 'INCORRECT'
    return makeResult({
      leftArm: armState(pose, 'left', exerciseConfig.pushUp.downAngle, exerciseConfig.pushUp.upAngle),
      rightArm: armState(pose, 'right', exerciseConfig.pushUp.downAngle, exerciseConfig.pushUp.upAngle),
      leftTorso: torso, rightTorso: torso,
    }, torso === 'INCORRECT' ? ['Gövde hizasını koruyun.'] : [])
  }
}

export class SitUpFormAnalyzer implements FormAnalyzer {
  analyze(pose: PoseFrame): FormAnalysisResult {
    const angle = calculateAngle(pose.leftShoulder, pose.leftHip, pose.leftKnee)
      ?? calculateAngle(pose.rightShoulder, pose.rightHip, pose.rightKnee)
    const state = angle === null ? 'UNKNOWN' : angle >= exerciseConfig.sitUp.acceptableMinAngle && angle <= exerciseConfig.sitUp.acceptableMaxAngle ? 'CORRECT' : 'INCORRECT'
    return makeResult({ leftTorso: state, rightTorso: state, leftLeg: state, rightLeg: state }, state === 'INCORRECT' ? ['Omuz-kalça-diz hizasını kontrol edin.'] : [])
  }
}

export class PullUpFormAnalyzer implements FormAnalyzer {
  analyze(pose: PoseFrame): FormAnalysisResult {
    const torso = pose.leftShoulder && pose.leftHip
      ? Math.abs(pose.leftShoulder.x - pose.leftHip.x) <= exerciseConfig.pullUp.swingTolerance ? 'CORRECT' : 'INCORRECT'
      : 'UNKNOWN'
    return makeResult({
      leftArm: armState(pose, 'left', exerciseConfig.pullUp.upAngle, exerciseConfig.pullUp.downAngle),
      rightArm: armState(pose, 'right', exerciseConfig.pullUp.upAngle, exerciseConfig.pullUp.downAngle),
      leftTorso: torso, rightTorso: torso,
    }, torso === 'INCORRECT' ? ['Gövde salınımını azaltın.'] : [])
  }
}

export function createFormAnalyzer(exercise: ExerciseType): FormAnalyzer {
  switch (exercise) {
    case 'pushUp': return new PushUpFormAnalyzer()
    case 'sitUp': return new SitUpFormAnalyzer()
    case 'pullUp': return new PullUpFormAnalyzer()
  }
}
