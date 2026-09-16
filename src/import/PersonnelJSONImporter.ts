import type { Personnel, PersonnelImportDTO } from '../models/types'

export type ImportStatus = 'NEW' | 'EXISTING' | 'INVALID'

export interface PersonnelImportRow {
  sourceIndex: number
  dto: PersonnelImportDTO
  status: ImportStatus
  reason?: string
}

export interface ImportPreview {
  rows: PersonnelImportRow[]
  total: number
  newCount: number
  existingCount: number
  invalidCount: number
}

export class PersonnelJSONImporter {
  preview(json: string, existing: Personnel[]): ImportPreview {
    let input: unknown
    try {
      input = JSON.parse(json)
    } catch {
      throw new Error('JSON DOSYASI OKUNAMADI')
    }
    if (!Array.isArray(input)) throw new Error('JSON DOSYASI OKUNAMADI')

    const sicilKeys = new Set(existing.map((person) => person.sicilNo && normalize(person.sicilNo)).filter(Boolean))
    const nameKeys = new Set(existing.map((person) => normalize(`${person.ad}${person.soyad}`)))
    const rows = input.map((value, sourceIndex) => {
      const dto = value as PersonnelImportDTO
      const errors: string[] = []
      if (!dto || typeof dto !== 'object') errors.push('Kayıt nesne değil.')
      if (typeof dto?.ad !== 'string' || !dto.ad.trim()) errors.push('Ad boş.')
      if (typeof dto?.soyad !== 'string' || !dto.soyad.trim()) errors.push('Soyad boş.')
      if (errors.length) return { sourceIndex, dto: dto ?? { ad: '', soyad: '' }, status: 'INVALID' as const, reason: errors.join(' ') }

      const sicilKey = dto.sicilNo?.trim() ? normalize(dto.sicilNo) : undefined
      const nameKey = normalize(`${dto.ad}${dto.soyad}`)
      const existingMatch = sicilKey ? sicilKeys.has(sicilKey) : nameKeys.has(nameKey)
      if (!existingMatch) {
        if (sicilKey) sicilKeys.add(sicilKey)
        nameKeys.add(nameKey)
      }
      return { sourceIndex, dto, status: existingMatch ? 'EXISTING' as const : 'NEW' as const }
    })
    return {
      rows,
      total: rows.length,
      newCount: rows.filter((row) => row.status === 'NEW').length,
      existingCount: rows.filter((row) => row.status === 'EXISTING').length,
      invalidCount: rows.filter((row) => row.status === 'INVALID').length,
    }
  }

  toNewPersonnel(preview: ImportPreview): Personnel[] {
    return preview.rows.filter((row) => row.status === 'NEW').map(({ dto }) => ({
      id: crypto.randomUUID(),
      sicilNo: dto.sicilNo?.trim() || undefined,
      rutbe: dto.rutbe?.trim() || undefined,
      ad: dto.ad.trim(),
      soyad: dto.soyad.trim(),
      birlik: dto.birlik?.trim() || undefined,
    }))
  }
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll(/\s+/g, '').toLocaleLowerCase('tr-TR')
}
