import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { exportBackup, restoreBackup } from './database'

const person = (id: string) => ({ id, ad: 'Deneme', soyad: 'Kişi' })
const result = (id: string, personnelId: string) => ({ id, personnelId, exerciseType: 'pushUp', repetitionCount: 8, date: '2026-11-17T08:00:00Z' })

describe('backup restoration', () => {
  it('deduplicates records in the file and repeated imports without overwriting saved data', async () => {
    const p = person('duplicate-person'), r = result('duplicate-result', p.id)
    const backup = { personnel: [p, p], results: [r, r] }
    expect(await restoreBackup(backup)).toEqual({ personnelAdded: 1, resultsAdded: 1 })
    expect(await restoreBackup(backup)).toEqual({ personnelAdded: 0, resultsAdded: 0 })
    expect(await restoreBackup({ personnel: [{ ...p, ad: 'Changed' }], results: [] })).toEqual({ personnelAdded: 0, resultsAdded: 0 })
    expect((await exportBackup()).personnel.find((item) => item.id === p.id)?.ad).toBe('Deneme')
  })
  it('rejects an orphan result without committing its otherwise valid personnel', async () => {
    const before = await exportBackup()
    await expect(restoreBackup({ personnel: [person('rollback-person')], results: [result('orphan-result', 'missing-person')] })).rejects.toThrow()
    const after = await exportBackup()
    expect(after.personnel).toEqual(before.personnel)
    expect(after.results).toEqual(before.results)
  })
  it.each([
    { repetitionCount: -1 }, { exerciseType: 'unknown' }, { date: 'invalid-date' }, { id: 17 },
  ])('rejects malformed result fields: %j', async (invalid) => {
    await expect(restoreBackup({ personnel: [person('invalid-person')], results: [{ ...result('invalid-result', 'invalid-person'), ...invalid }] })).rejects.toThrow()
    expect((await exportBackup()).personnel.some((p) => p.id === 'invalid-person')).toBe(false)
  })
  it('rejects malformed names cleanly', async () => {
    await expect(restoreBackup({ personnel: [{ id: 'invalid-name', ad: 42, soyad: 'Test' }], results: [] })).rejects.toThrow('geçersiz')
  })
})
