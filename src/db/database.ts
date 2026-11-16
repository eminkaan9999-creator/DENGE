import { openDB, type DBSchema } from 'idb'
import type { Personnel, TestResult } from '../models/types'

interface DengeDB extends DBSchema {
  personnel: { key: string; value: Personnel; indexes: { 'by-name': string; 'by-sicil': string } }
  results: { key: string; value: TestResult; indexes: { 'by-personnel': string } }
}

const database = openDB<DengeDB>('denge-pwa', 1, {
  upgrade(db) {
    const personnel = db.createObjectStore('personnel', { keyPath: 'id' })
    personnel.createIndex('by-name', 'ad')
    personnel.createIndex('by-sicil', 'sicilNo')
    const results = db.createObjectStore('results', { keyPath: 'id' })
    results.createIndex('by-personnel', 'personnelId')
  },
})

export const PersonnelRepository = {
  async all(): Promise<Personnel[]> {
    return (await database).getAll('personnel')
  },
  async save(personnel: Personnel): Promise<void> {
    await (await database).put('personnel', personnel)
  },
  async saveMany(personnel: Personnel[]): Promise<void> {
    const db = await database
    const tx = db.transaction('personnel', 'readwrite')
    await Promise.all(personnel.map((item) => tx.store.put(item)))
    await tx.done
  },
  async remove(personnelId: string): Promise<void> {
    const db = await database
    const tx = db.transaction(['personnel', 'results'], 'readwrite')
    await tx.objectStore('personnel').delete(personnelId)
    const resultStore = tx.objectStore('results')
    const results = await resultStore.index('by-personnel').getAll(personnelId)
    await Promise.all(results.map((result) => resultStore.delete(result.id)))
    await tx.done
  },
}

export const TestResultRepository = {
  async all(): Promise<TestResult[]> {
    return (await database).getAll('results').then(sortResults)
  },
  async forPersonnel(personnelId: string): Promise<TestResult[]> {
    return (await database).getAllFromIndex('results', 'by-personnel', personnelId).then(sortResults)
  },
  async save(result: TestResult): Promise<void> {
    const db = await database
    const existing = await db.get('results', result.id)
    if (!existing) await db.add('results', result)
  },
}

export async function exportBackup(): Promise<{ personnel: Personnel[]; results: TestResult[]; exportedAt: string }> {
  return { personnel: await PersonnelRepository.all(), results: await TestResultRepository.all(), exportedAt: new Date().toISOString() }
}

export async function restoreBackup(input: unknown): Promise<{ personnelAdded: number; resultsAdded: number }> {
  if (!input || typeof input !== 'object') throw new Error('Geçersiz yedek dosyası.')
  const data = input as Partial<{ personnel: Personnel[]; results: TestResult[] }>
  if (!Array.isArray(data.personnel) || !Array.isArray(data.results)) throw new Error('Geçersiz yedek dosyası.')
  if (!data.personnel.every(validPersonnel) || !data.results.every(validResult)) throw new Error('Yedekte geçersiz kayıt var.')
  const db = await database
  const tx = db.transaction(['personnel', 'results'], 'readwrite')
  const done = tx.done
  // Attach a rejection handler before requests can abort the transaction.
  void done.catch(() => undefined)
  try {
    const peopleStore = tx.objectStore('personnel')
    const resultsStore = tx.objectStore('results')
    const [peopleKeys, resultKeys] = await Promise.all([peopleStore.getAllKeys(), resultsStore.getAllKeys()])
    const personIds = new Set(peopleKeys)
    const resultIds = new Set(resultKeys)
    const newPeople = data.personnel.filter((item) => {
      if (personIds.has(item.id)) return false
      personIds.add(item.id)
      return true
    })
    const newResults = data.results.filter((item) => {
      if (resultIds.has(item.id)) return false
      if (!personIds.has(item.personnelId)) throw new Error('Sonucun personel kaydı bulunamadı.')
      resultIds.add(item.id)
      return true
    })
    await Promise.all([
      ...newPeople.map((item) => peopleStore.add(item)),
      ...newResults.map((item) => resultsStore.add(item)),
    ])
    await done
    return { personnelAdded: newPeople.length, resultsAdded: newResults.length }
  } catch (error) {
    try { tx.abort() } catch { /* The transaction may already have aborted. */ }
    await done.catch(() => undefined)
    throw error
  }
}

function sortResults(results: TestResult[]): TestResult[] {
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function validPersonnel(value: unknown): value is Personnel {
  const person = value as Personnel
  return Boolean(nonEmptyString(person?.id) && nonEmptyString(person?.ad) && nonEmptyString(person?.soyad) &&
    [person?.sicilNo, person?.rutbe, person?.birlik].every((field) => field === undefined || typeof field === 'string'))
}

function validResult(value: unknown): value is TestResult {
  const result = value as TestResult
  return Boolean(nonEmptyString(result?.id) && nonEmptyString(result?.personnelId) &&
    ['pushUp', 'sitUp', 'pullUp'].includes(result?.exerciseType) &&
    Number.isSafeInteger(result?.repetitionCount) && result.repetitionCount >= 0 &&
    nonEmptyString(result?.date) && Number.isFinite(Date.parse(result.date)))
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
