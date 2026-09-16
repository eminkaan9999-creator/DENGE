export type ExerciseType = 'pushUp' | 'sitUp' | 'pullUp'
export type FormState = 'CORRECT' | 'INCORRECT' | 'UNKNOWN'

export interface Personnel {
  id: string
  sicilNo?: string
  rutbe?: string
  ad: string
  soyad: string
  birlik?: string
}

export interface PersonnelImportDTO {
  sicilNo?: string
  rutbe?: string
  ad: string
  soyad: string
  birlik?: string
}

export interface TestResult {
  id: string
  personnelId: string
  exerciseType: ExerciseType
  repetitionCount: number
  date: string
}

export type JointName =
  | 'nose'
  | 'leftShoulder' | 'rightShoulder'
  | 'leftElbow' | 'rightElbow'
  | 'leftWrist' | 'rightWrist'
  | 'leftHip' | 'rightHip'
  | 'leftKnee' | 'rightKnee'
  | 'leftAnkle' | 'rightAnkle'

export interface JointPoint {
  jointName: JointName
  x: number
  y: number
  z: number
  visibility: number
}

export type PoseFrame = Partial<Record<JointName, JointPoint>>

export type SegmentName =
  | 'leftArm' | 'rightArm' | 'shoulderLine'
  | 'leftTorso' | 'rightTorso' | 'hipLine'
  | 'leftLeg' | 'rightLeg'

export interface FormAnalysisResult {
  overallState: FormState
  jointStates: Partial<Record<JointName, FormState>>
  segmentStates: Partial<Record<SegmentName, FormState>>
  detectedIssues: string[]
}

export interface AppSettings {
  facingMode: 'user' | 'environment'
  showSkeleton: boolean
  showJoints: boolean
  useFormColors: boolean
}

export const defaultSettings: AppSettings = {
  facingMode: 'environment',
  showSkeleton: true,
  showJoints: true,
  useFormColors: true,
}

export const exerciseTitle: Record<ExerciseType, string> = {
  pushUp: 'Şınav',
  sitUp: 'Mekik',
  pullUp: 'Barfiks',
}
