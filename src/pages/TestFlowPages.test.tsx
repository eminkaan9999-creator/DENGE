import { afterEach, expect, it, vi } from 'vitest'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { TestSummaryPage } from './TestFlowPages'
const mocks = vi.hoisted(() => ({ save: vi.fn() }))
vi.mock('../db/database', () => ({ PersonnelRepository: {}, TestResultRepository: { save: mocks.save } }))
vi.mock('../camera/CameraView', () => ({ CameraView: () => null }))
let tree: ReactTestRenderer
afterEach(() => { act(() => tree.unmount()); mocks.save.mockReset() })
const mount = () => act(() => { tree = create(<TestSummaryPage personnel={{ id: 'test', ad: 'Deneme', soyad: 'Kişi' }} exerciseType="pushUp" repetitionCount={8} date="2026-11-17T08:00:00Z" onRetry={() => {}} onCancel={() => {}} />) })
it('ignores rapid duplicate save clicks', async () => {
  let resolve!: () => void
  mocks.save.mockReturnValue(new Promise<void>((r) => { resolve = r }))
  mount()
  const click = tree.root.findAllByType('button')[0].props.onClick
  act(() => { click(); click() })
  expect(mocks.save).toHaveBeenCalledTimes(1)
  await act(async () => resolve())
  expect(tree.root.findAllByType('button')[0].children).toContain('KAYDEDİLDİ')
})
it('keeps the result available for retry after a storage failure', async () => {
  mocks.save.mockRejectedValueOnce(new Error('quota')).mockResolvedValueOnce(undefined)
  mount()
  await act(async () => tree.root.findAllByType('button')[0].props.onClick())
  expect(tree.root.findByProps({ role: 'alert' }).children.join('')).toContain('Tekrar deneyin')
  await act(async () => tree.root.findAllByType('button')[0].props.onClick())
  expect(mocks.save.mock.calls[0][0].id).toBe(mocks.save.mock.calls[1][0].id)
})
