import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision'
import { exerciseConfig } from '../config/exerciseConfig'
import type { JointName, PoseFrame } from '../models/types'

const WASM_ROOT = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'

const landmarkIndices: Record<JointName, number> = {
  nose: 0,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
}

export class BrowserPoseDetector {
  private constructor(private readonly landmarker: PoseLandmarker) {}

  static async create(): Promise<BrowserPoseDetector> {
    const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: exerciseConfig.poseVisibilityThreshold,
      minPosePresenceConfidence: exerciseConfig.poseVisibilityThreshold,
      minTrackingConfidence: exerciseConfig.poseVisibilityThreshold,
    })
    return new BrowserPoseDetector(landmarker)
  }

  detect(video: HTMLVideoElement, timestampMs: number): PoseFrame | null {
    const result = this.landmarker.detectForVideo(video, timestampMs)
    const landmarks = result.landmarks[0]
    if (!landmarks) return null
    const frame: PoseFrame = {}
    for (const [jointName, index] of Object.entries(landmarkIndices) as Array<[JointName, number]>) {
      const point = landmarks[index]
      const visibility = point.visibility ?? 0
      if (visibility >= exerciseConfig.poseVisibilityThreshold) {
        frame[jointName] = { jointName, x: point.x, y: point.y, z: point.z, visibility }
      }
    }
    return Object.keys(frame).length ? frame : null
  }

  close(): void { this.landmarker.close() }
}
