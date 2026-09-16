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
  const existingPeople = await PersonnelRepository.all()
  const existingResults = await TestResultRepository.all()
  const personIds = new Set(existingPeople.map((item) => item.id))
  const resultIds = new Set(existingResults.map((item) => item.id))
  const newPeople = data.personnel.filter((item) => validPersonnel(item) && !personIds.has(item.id))
  const newResults = data.results.filter((item) => validResult(item) && !resultIds.has(item.id))
  await PersonnelRepository.saveMany(newPeople)
  const db = await database
  const tx = db.transaction('results', 'readwrite')
  await Promise.all(newResults.map((item) => tx.store.add(item)))
  await tx.done
  return { personnelAdded: newPeople.length, resultsAdded: newResults.length }
}

function sortResults(results: TestResult[]): TestResult[] {
  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function validPersonnel(value: unknown): value is Personnel {
  const person = value as Personnel
  return Boolean(person?.id && person.ad?.trim() && person.soyad?.trim())
}

function validResult(value: unknown): value is TestResult {
  const result = value as TestResult
  return Boolean(result?.id && result.personnelId && result.exerciseType && Number.isInteger(result.repetitionCount) && result.date)
}
