export const exerciseConfig = {
  poseVisibilityThreshold: 0.5,
  analysisFPS: 18,
  poseSmoothingFrames: 4,
  formDebounceFrames: 4,
  missingPersonDelayMs: 1_200,
  pushUp: {
    upAngle: 155,
    downAngle: 90,
    bodyAlignmentTolerance: 25,
  },
  sitUp: {
    upAngle: 95,
    downAngle: 150,
    acceptableMinAngle: 45,
    acceptableMaxAngle: 175,
  },
  pullUp: {
    upAngle: 95,
    downAngle: 150,
    swingTolerance: 0.2,
  },
} as const
