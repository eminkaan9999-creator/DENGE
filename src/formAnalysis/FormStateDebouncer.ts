import { exerciseConfig } from '../config/exerciseConfig'
import type { FormAnalysisResult, FormState, SegmentName } from '../models/types'

export class FormStateDebouncer {
  private stable: Partial<Record<SegmentName, FormState>> = {}
  private candidate: Partial<Record<SegmentName, { state: FormState; frames: number }>> = {}

  stabilize(result: FormAnalysisResult): FormAnalysisResult {
    for (const [name, proposed] of Object.entries(result.segmentStates) as Array<[SegmentName, FormState]>) {
      const current = this.stable[name] ?? 'UNKNOWN'
      if (proposed === current) {
        delete this.candidate[name]
      } else if (this.candidate[name]?.state === proposed) {
        const frames = (this.candidate[name]?.frames ?? 0) + 1
        this.candidate[name] = { state: proposed, frames }
        if (frames >= exerciseConfig.formDebounceFrames) {
          this.stable[name] = proposed
          delete this.candidate[name]
        }
      } else {
        this.candidate[name] = { state: proposed, frames: 1 }
      }
    }
    const segmentStates = this.stable
    const states = Object.values(segmentStates)
    return { ...result, segmentStates, overallState: states.includes('INCORRECT') ? 'INCORRECT' : states.includes('CORRECT') ? 'CORRECT' : 'UNKNOWN' }
  }

  reset(): void { this.stable = {}; this.candidate = {} }
}
