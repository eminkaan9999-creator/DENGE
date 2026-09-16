import { useCallback, useEffect, useRef, useState } from 'react'
import { createExerciseAnalyzer } from '../analysis/ExerciseAnalyzer'
import { exerciseConfig } from '../config/exerciseConfig'
import { createFormAnalyzer } from '../formAnalysis/FormAnalyzer'
import { FormStateDebouncer } from '../formAnalysis/FormStateDebouncer'
import type { AppSettings, ExerciseType, FormAnalysisResult, PoseFrame } from '../models/types'
import { BrowserPoseDetector } from '../pose/PoseDetector'
import { PoseSmoother } from '../pose/PoseSmoother'
import { renderSkeleton } from '../pose/SkeletonRenderer'

interface CameraViewProps {
  exerciseType: ExerciseType
  settings: AppSettings
  onFinish: (repetitions: number) => void
}

type CameraState = 'loading' | 'ready' | 'permissionDenied' | 'error'

export function CameraView({ exerciseType, settings, onFinish }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BrowserPoseDetector | null>(null)
  const animationRef = useRef<number | null>(null)
  const stoppedRef = useRef(false)
  const formRef = useRef<FormAnalysisResult>({ overallState: 'UNKNOWN', jointStates: {}, segmentStates: {}, detectedIssues: [] })
  const repetitionRef = useRef(0)
  const [state, setState] = useState<CameraState>('loading')
  const [message, setMessage] = useState('Kamera hazırlanıyor…')
  const [repetitions, setRepetitions] = useState(0)
  const [form, setForm] = useState<FormAnalysisResult>({ overallState: 'UNKNOWN', jointStates: {}, segmentStates: {}, detectedIssues: [] })

  const stop = useCallback(() => {
    stoppedRef.current = true
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current)
    animationRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    detectorRef.current?.close()
    detectorRef.current = null
  }, [])

  const start = useCallback(async () => {
    stop()
    stoppedRef.current = false
    setState('loading')
    setMessage('Kamera hazırlanıyor…')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Kamera için HTTPS bağlantısı gereklidir.')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: settings.facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      if (stoppedRef.current) { stream.getTracks().forEach((track) => track.stop()); return }
      streamRef.current = stream
      const video = videoRef.current
      if (!video) return
      video.srcObject = stream
      await video.play()
      detectorRef.current = await BrowserPoseDetector.create()
      if (stoppedRef.current) return
      setState('ready')

      const analyzer = createExerciseAnalyzer(exerciseType)
      const formAnalyzer = createFormAnalyzer(exerciseType)
      const smoother = new PoseSmoother(exerciseConfig.poseSmoothingFrames)
      const debouncer = new FormStateDebouncer()
      let lastVideoTime = -1
      let lastInference = 0
      let missingSince: number | null = null
      let currentPose: PoseFrame | null = null
      let currentForm = formRef.current
      const interval = 1000 / exerciseConfig.analysisFPS

      const loop = (now: number) => {
        if (stoppedRef.current || !videoRef.current || !canvasRef.current || !detectorRef.current) return
        const activeVideo = videoRef.current
        if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && activeVideo.currentTime !== lastVideoTime && now - lastInference >= interval) {
          lastVideoTime = activeVideo.currentTime
          lastInference = now
          const detected = detectorRef.current.detect(activeVideo, Math.round(now))
          if (detected) {
            currentPose = smoother.smooth(detected)
            analyzer.process(currentPose)
            const nextForm = debouncer.stabilize(formAnalyzer.analyze(currentPose))
            currentForm = nextForm
            formRef.current = nextForm
            missingSince = null
            repetitionRef.current = analyzer.repetitionCount
            setRepetitions((previous) => previous === analyzer.repetitionCount ? previous : analyzer.repetitionCount)
            setForm((previous) => previous.overallState === nextForm.overallState ? previous : nextForm)
            setMessage(nextForm.overallState === 'CORRECT' ? 'DURUŞ UYGUN' : nextForm.overallState === 'INCORRECT' ? 'DURUŞU DÜZELT' : 'KONUMLANMANIZI DÜZELTİN')
          } else {
            currentPose = null
            if (missingSince === null) missingSince = now
            if (now - missingSince >= exerciseConfig.missingPersonDelayMs) setMessage('KİŞİ ALGILANAMADI')
          }
        }
        renderSkeleton(canvasRef.current, activeVideo, currentPose, currentForm, {
          mirror: settings.facingMode === 'user',
          showSkeleton: settings.showSkeleton,
          showJoints: settings.showJoints,
          useFormColors: settings.useFormColors,
        })
        animationRef.current = requestAnimationFrame(loop)
      }
      animationRef.current = requestAnimationFrame(loop)
    } catch (error) {
      const errorName = error instanceof DOMException ? error.name : ''
      setState(errorName === 'NotAllowedError' ? 'permissionDenied' : 'error')
      setMessage(errorName === 'NotAllowedError' ? 'Kamera izni gereklidir.' : error instanceof Error ? error.message : 'Kamera başlatılamadı.')
      stop()
    }
  }, [exerciseType, settings, stop])

  useEffect(() => { void start(); return stop }, [start, stop])
  useEffect(() => {
    const onVisibilityChange = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [stop])

  const finish = () => { stop(); onFinish(repetitionRef.current) }

  return <>
    <div className="counter"><small>TEKRAR</small><strong>{repetitions}</strong></div>
    <div className="camera-stage">
      <video ref={videoRef} playsInline muted autoPlay className={settings.facingMode === 'user' ? 'mirror' : ''} />
      <canvas ref={canvasRef} aria-label="Canlı iskelet çizimi" />
      {state !== 'ready' && <div className="camera-overlay"><div className="notice">{message}</div></div>}
    </div>
    <div className={`status ${form.overallState === 'CORRECT' ? 'status-correct' : form.overallState === 'INCORRECT' ? 'status-incorrect' : 'status-unknown'}`}>{message}</div>
    {(state === 'permissionDenied' || state === 'error') && <button className="button secondary" onClick={() => void start()}>Kamera İznini Tekrar Dene</button>}
    <button className="button danger" onClick={finish}>BİTİR</button>
  </>
}
