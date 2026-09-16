import type { FormAnalysisResult, FormState, JointName, PoseFrame, SegmentName } from '../models/types'

const connections: Array<[JointName, JointName, SegmentName]> = [
  ['leftShoulder', 'leftElbow', 'leftArm'], ['leftElbow', 'leftWrist', 'leftArm'],
  ['rightShoulder', 'rightElbow', 'rightArm'], ['rightElbow', 'rightWrist', 'rightArm'],
  ['leftShoulder', 'rightShoulder', 'shoulderLine'],
  ['leftShoulder', 'leftHip', 'leftTorso'], ['rightShoulder', 'rightHip', 'rightTorso'],
  ['leftHip', 'rightHip', 'hipLine'],
  ['leftHip', 'leftKnee', 'leftLeg'], ['leftKnee', 'leftAnkle', 'leftLeg'],
  ['rightHip', 'rightKnee', 'rightLeg'], ['rightKnee', 'rightAnkle', 'rightLeg'],
]

export interface SkeletonOptions {
  mirror: boolean
  showSkeleton: boolean
  showJoints: boolean
  useFormColors: boolean
}

export function renderSkeleton(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  pose: PoseFrame | null,
  form: FormAnalysisResult,
  options: SkeletonOptions,
): void {
  const rect = video.getBoundingClientRect()
  const scale = window.devicePixelRatio || 1
  const pixelWidth = Math.round(rect.width * scale)
  const pixelHeight = Math.round(rect.height * scale)
  if (!pixelWidth || !pixelHeight || !video.videoWidth || !video.videoHeight) return
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth
    canvas.height = pixelHeight
  }
  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(scale, 0, 0, scale, 0, 0)
  context.clearRect(0, 0, rect.width, rect.height)
  if (!pose) return

  // video object-fit: cover geometrisi: taşan yatay/dikey alanı doğru hesaba katılır.
  const videoAspect = video.videoWidth / video.videoHeight
  const boxAspect = rect.width / rect.height
  const drawWidth = videoAspect > boxAspect ? rect.height * videoAspect : rect.width
  const drawHeight = videoAspect > boxAspect ? rect.height : rect.width / videoAspect
  const offsetX = (rect.width - drawWidth) / 2
  const offsetY = (rect.height - drawHeight) / 2
  const pointToCanvas = (point: { x: number; y: number }) => ({
    x: offsetX + (options.mirror ? 1 - point.x : point.x) * drawWidth,
    y: offsetY + point.y * drawHeight,
  })

  if (options.showSkeleton) {
    context.lineWidth = 3
    context.lineCap = 'round'
    for (const [startName, endName, segment] of connections) {
      const start = pose[startName]
      const end = pose[endName]
      if (!start || !end) continue
      context.strokeStyle = colorFor(form.segmentStates[segment] ?? 'UNKNOWN', options.useFormColors)
      const first = pointToCanvas(start)
      const second = pointToCanvas(end)
      context.beginPath()
      context.moveTo(first.x, first.y)
      context.lineTo(second.x, second.y)
      context.stroke()
    }
  }

  if (options.showJoints) {
    for (const [name, point] of Object.entries(pose) as Array<[JointName, NonNullable<PoseFrame[JointName]>]>) {
      if (!point) continue
      const canvasPoint = pointToCanvas(point)
      context.fillStyle = colorFor(form.jointStates[name] ?? 'UNKNOWN', options.useFormColors)
      context.beginPath()
      context.arc(canvasPoint.x, canvasPoint.y, 5, 0, Math.PI * 2)
      context.fill()
    }
  }
}

function colorFor(state: FormState, usesFormColors: boolean): string {
  if (!usesFormColors) return '#a66bff'
  if (state === 'CORRECT') return '#22c55e'
  if (state === 'INCORRECT') return '#ef4444'
  return '#a0a0a0'
}
