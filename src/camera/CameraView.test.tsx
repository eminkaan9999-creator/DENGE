import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { CameraView } from './CameraView'
import { defaultSettings } from '../models/types'

const mocks = vi.hoisted(() => ({ createDetector: vi.fn() }))
vi.mock('../pose/PoseDetector', () => ({ BrowserPoseDetector: { create: mocks.createDetector } }))
let tree: ReactTestRenderer | undefined
let page: EventTarget & { hidden: boolean }
let media: ReturnType<typeof vi.fn>
const deferred = <T,>() => { let resolve!: (value: T) => void; const promise = new Promise<T>((r) => { resolve = r }); return { promise, resolve } }
const stream = () => { const stop = vi.fn(); return { value: { getTracks: () => [{ stop }] } as unknown as MediaStream, stop } }

beforeEach(() => {
  page = Object.assign(new EventTarget(), { hidden: false })
  media = vi.fn()
  vi.stubGlobal('document', page)
  vi.stubGlobal('window', { isSecureContext: true })
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: media } })
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  mocks.createDetector.mockReset().mockResolvedValue({ close: vi.fn() })
})
afterEach(() => { if (tree) act(() => tree!.unmount()); tree = undefined; vi.unstubAllGlobals() })
async function mount() {
  await act(async () => { tree = create(<CameraView exerciseType="pushUp" settings={defaultSettings} onFinish={() => {}} />, { createNodeMock: (element) => element.type === 'video' ? { play: vi.fn().mockResolvedValue(undefined), srcObject: null } : {} }) })
}
function pause() { act(() => { page.hidden = true; page.dispatchEvent(new Event('visibilitychange')) }) }

it('offers resume after backgrounding and stops the old camera', async () => {
  const first = stream(), second = stream()
  media.mockResolvedValueOnce(first.value).mockResolvedValueOnce(second.value)
  await mount(); pause()
  expect(first.stop).toHaveBeenCalledOnce()
  const resume = tree!.root.findAllByType('button').find((button) => button.children.includes('Kamerayı Yeniden Aç'))!
  expect(resume).toBeDefined()
  await act(async () => resume.props.onClick())
  expect(media).toHaveBeenCalledTimes(2)
  expect(second.stop).not.toHaveBeenCalled()
})
it('disposes a stale camera permission result after a new session starts', async () => {
  const old = deferred<MediaStream>(), first = stream(), second = stream()
  media.mockReturnValueOnce(old.promise).mockResolvedValueOnce(second.value)
  await mount(); pause()
  await act(async () => tree!.root.findAllByType('button').find((button) => button.children.includes('Kamerayı Yeniden Aç'))!.props.onClick())
  await act(async () => old.resolve(first.value))
  expect(first.stop).toHaveBeenCalledOnce()
  expect(second.stop).not.toHaveBeenCalled()
  expect(mocks.createDetector).toHaveBeenCalledTimes(1)
})
it('closes a detector that finishes loading after unmount', async () => {
  const pending = deferred<{ close: ReturnType<typeof vi.fn> }>(), detector = { close: vi.fn() }
  media.mockResolvedValue(stream().value); mocks.createDetector.mockReturnValue(pending.promise)
  await mount(); act(() => tree!.unmount()); tree = undefined
  await act(async () => pending.resolve(detector))
  expect(detector.close).toHaveBeenCalledOnce()
})
